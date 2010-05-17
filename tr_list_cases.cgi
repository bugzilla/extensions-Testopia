#!/usr/bin/perl -wT
# -*- Mode: perl; indent-tabs-mode: nil -*-
#
# The contents of this file are subject to the Mozilla Public
# License Version 1.1 (the "License"); you may not use this file
# except in compliance with the License. You may obtain a copy of
# the License at http://www.mozilla.org/MPL/
#
# Software distributed under the License is distributed on an "AS
# IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
# implied. See the License for the specific language governing
# rights and limitations under the License.
#
# The Original Code is the Bugzilla Testopia System.
#
# The Initial Developer of the Original Code is Greg Hendricks.
# Portions created by Greg Hendricks are Copyright (C) 2006
# Novell. All Rights Reserved.
#
# Contributor(s): Greg Hendricks <ghendricks@novell.com>
#                 Jeff Dayley <jedayley@novell.com>

use strict;
use lib qw(. lib extensions/testopia/lib);

use Bugzilla;
use Bugzilla::Util;
use Bugzilla::User;
use Bugzilla::Error;
use Bugzilla::Constants;
use Testopia::Search;
use Testopia::Util;
use Testopia::Category;
use Testopia::TestCase;
use Testopia::TestCaseRun;
use Testopia::TestPlan;
use Testopia::TestTag;
use Testopia::Table;
use Testopia::Constants;

my $vars = {};

my $cgi = Bugzilla->cgi;
my $template = Bugzilla->template;

Bugzilla->login(LOGIN_REQUIRED);

# Determine the format in which the user would like to receive the output.
# Uses the default format if the user did not specify an output format;
# otherwise validates the user's choice against the list of available formats.
my $format = $template->get_format("testopia/case/list", scalar $cgi->param('format'), scalar $cgi->param('ctype'));
my $action = $cgi->param('action') || '';

# prevent DOS attacks from multiple refreshes of large data
$::SIG{TERM} = 'DEFAULT';
$::SIG{PIPE} = 'DEFAULT';

###############
### Actions ###
###############
if ($action eq 'update'){
    Bugzilla->error_mode(ERROR_MODE_AJAX);
    print $cgi->header;
    my @case_ids = split(',', $cgi->param('ids'));
    ThrowUserError('testopia-none-selected', {'object' => 'case'}) unless (scalar @case_ids);

    my @uneditable;
    my @runs;
    my @bugs;
    my @components;
    
    foreach my $runid (split(/[\s,]+/, $cgi->param('addruns'))){
        validate_test_id($runid, 'run');
        push @runs, Testopia::TestRun->new($runid);
    }

    foreach my $bugid (split(/[\s,]+/, $cgi->param('bugs'))){
        Bugzilla::Bug->check($bugid);
        push @bugs, $bugid;
    }
    
    my @comps = $cgi->param("components");
    my (@addcomponents,@remcomponents);
    foreach my $id (@comps){
        detaint_natural($id);
        validate_selection($id, 'id', 'components');
        if ($cgi->param('comp_action') eq 'add'){
            push @addcomponents, $id;
        }
        else {
            push @remcomponents, $id;
        }
    }
    
    foreach my $p (@case_ids){
        my $case = Testopia::TestCase->new($p);
        next unless $case;
        
        unless ($case->canedit){
            push @uneditable, $case;
            next;
        }

        $case->set_requirement($cgi->param('requirement')) if $cgi->param('requirement');
        $case->set_case_status($cgi->param('status')) if $cgi->param('status');
        $case->set_priority($cgi->param('priority')) if $cgi->param('priority');
        $case->set_isautomated($cgi->param('isautomated') eq 'on' ? 1 : 0) if $cgi->param('isautomated');
        $case->set_script($cgi->param('script')) if $cgi->param('script');
        $case->set_arguments($cgi->param('arguments')) if $cgi->param('arguments');
        $case->set_category($cgi->param('category')) if $cgi->param('category');    
        $case->set_default_tester($cgi->param('tester')) if $cgi->param('tester');
        
        $case->update();

        $case->add_component($_) foreach (@addcomponents);
        $case->remove_component($_) foreach (@remcomponents);

        # Add to runs
        foreach my $run (@runs){
            $run->add_case_run($case->id, $case->sortkey) if $run->canedit;
        }
        
        $case->attach_bugs(\@bugs) if $cgi->param('bugs_action') eq 'add';
        $case->detach_bugs(\@bugs) if $cgi->param('bugs_action') eq 'remove'; 
    }
    ThrowUserError('testopia-update-failed', {'object' => 'plan', 'list' => join(',',@uneditable)}) if (scalar @uneditable);
    print "{'success': true}";    

}

elsif ($action eq 'clone'){
    Bugzilla->error_mode(ERROR_MODE_AJAX);
    print $cgi->header;

    my @case_ids = split(',', $cgi->param('ids'));
    ThrowUserError('testopia-none-selected', {'object' => 'case'}) unless (scalar @case_ids);
    
    my %planseen;
    foreach my $planid (split(",", $cgi->param('plan_ids'))){
        validate_test_id($planid, 'plan');
        my $plan = Testopia::TestPlan->new($planid);
        ThrowUserError("testopia-read-only", {'object' => $plan}) unless $plan->canedit;
        $planseen{$planid} = 1;
    }
    
    ThrowUserError('missing-plans-list') unless scalar keys %planseen;
    
    my $product = Testopia::Product->new($cgi->param('product_id'));
    ThrowUserError('invalid-test-id-non-existent', {type => 'Product', id => $cgi->param('product_id')}) unless $product;
    
    if ($cgi->param('copy_category')){
        ThrowUserError('testopia-read-only', {'object' => $product}) unless $product->canedit;
    }
    
    my @newcases;
    foreach my $id (@case_ids){
        my $case = Testopia::TestCase->new($id);
        next unless $case;
        next unless ($case->canview);
    
        # Clone
        if ($cgi->param('copy_cases')){
            # Copy test cases creating new ones
            my $case_author = $cgi->param('keep_author') ? $case->author->id : Bugzilla->user->id;
            my $case_tester = $cgi->param('keep_tester') ? $case->default_tester->id : Bugzilla->user->id;
            my $category;
            if ($cgi->param('copy_category')){
                my $category_id = check_case_category($case->category->name, $product);
                if (! $category_id){
                    $category = Testopia::Category->create({
                        product_id  => $product->id,
                        name        => $case->category->name,
                        description => $case->category->description,
                    });
                }
                else {
                   $category = Testopia::Category->new($category_id); 
                }
            }
            else {
                if ($product->id == $case->category->product_id){
                    $category = $case->category;
                }
                else{
                    my @categories = @{$product->categories};
                    if (scalar @categories < 1){
                        $category = Testopia::Category->create({
                            product_id  => $product->id,
                            name        => '--default--',
                            description => 'Default product category for test cases',
                        });
                         
                    }
                    else{
                        $category = $categories[0];
                    }
                }
            }

            my $caseid = $case->copy($case_author, $case_tester, $cgi->param('copy_doc') eq 'on' ? 1 : 0, $category->id);
            my $newcase = Testopia::TestCase->new($caseid);
            push @newcases,  $newcase->id;
            
            foreach my $plan_id (keys %planseen){
                $newcase->link_plan($plan_id, $caseid);
            }
            
            if ($cgi->param('copy_attachments')){
                foreach my $att (@{$case->attachments}){
                    $att->link_case($newcase->id);
                }
            }
            if ($cgi->param('copy_tags')){
                foreach my $tag (@{$case->tags}){
                    $newcase->add_tag($tag->name);
                }
            }
            if ($cgi->param('copy_comps')){
                foreach my $comp (@{$case->components}){
                    $newcase->add_component($comp->{'id'});
                }
            }
        }
        # Just create a link
        else {
            foreach my $plan_id (keys %planseen){
                $case->link_plan($plan_id);
            }
        }
    }
    print "{'success': true, 'tclist': [". join(", ", @newcases) ."]}";
}

elsif ($action eq 'delete'){
    Bugzilla->error_mode(ERROR_MODE_AJAX);
    print $cgi->header;
    
    my @case_ids = split(",", $cgi->param('case_ids'));
    my @uneditable;
    foreach my $id (@case_ids){
        my $case = Testopia::TestCase->new($id);
        unless ($case->candelete){
            push @uneditable, $case;
            next;
        }
        
        $case->obliterate;
    }

    ThrowUserError('testopia-delete-failed', {'object' => 'case', 'list' => join(',',@uneditable)}) if (scalar @uneditable);
    print "{'success': true}";
}

elsif ($action eq 'unlink'){
    Bugzilla->error_mode(ERROR_MODE_AJAX);
    print $cgi->header;
    my $plan_id = $cgi->param('plan_id');
    validate_test_id($plan_id, 'plan');
    foreach my $id (split(",", $cgi->param('case_ids'))){
        my $case = Testopia::TestCase->new($id);
        if (scalar @{$case->plans} == 1){
            ThrowUserError("testopia-read-only", {'object' => 'case'}) unless ($case->candelete);
            $case->obliterate();
        }
        else {
            ThrowUserError("testopia-read-only", {'object' => 'case'}) unless ($case->can_unlink_plan($plan_id));
            $case->unlink_plan($plan_id);
        }
    }
    print "{'success': true}";
}

elsif ($action eq 'update_bugs'){
    Bugzilla->error_mode(ERROR_MODE_AJAX);
    print $cgi->header;
    
    my @ids = split(",", $cgi->param('ids'));
    my @objs;
    foreach my $id (split(",", $cgi->param('ids'))){
        if ($cgi->param('type') eq 'case'){
            my $case = Testopia::TestCase->new($id);
            if ($cgi->param('bug_action') eq 'attach'){
                $case->attach_bug($cgi->param('bugs')) if $case->canedit;
            }
            else {
                $case->detach_bug($cgi->param('bugs')) if $case->canedit;
            }
        } elsif($cgi->param('type') eq 'caserun'){
            my $caserun = Testopia::TestCaseRun->new($id);
            if ($cgi->param('bug_action') eq 'attach'){
                $caserun->attach_bug($cgi->param('bugs'), $id) if $caserun->canedit;
            }
            else {
                $caserun->detach_bug($cgi->param('bugs')) if $caserun->canedit;
            }
        } 
    }
    print "{'success': true}";
}

else{
    $vars->{'qname'} = $cgi->param('qname') if $cgi->param('qname');
    $vars->{'report'} = $cgi->param('report_type') if $cgi->param('report_type');
    $vars->{'plan_ids'} = $cgi->param('plan_ids') if $cgi->param('plan_ids');
    $vars->{'run_ids'} = $cgi->param('run_ids') if $cgi->param('run_ids');

    $cgi->param('current_tab', 'case');
    $cgi->param('distinct', '1');
    my $search = Testopia::Search->new($cgi);
    my $table = Testopia::Table->new('case', 'tr_list_cases.cgi', $cgi, undef, $search->query);
    $vars->{'table'} = $table;
    if ($cgi->param('ctype') eq 'json'){
        Bugzilla->error_mode(ERROR_MODE_AJAX);
        print $cgi->header;
        $vars->{'json'} = $table->to_ext_json;
        $template->process($format->{'template'}, $vars)
            || ThrowTemplateError($template->error());
        exit;
    }
    
    my @time = localtime(time());
    my $date = sprintf "%04d-%02d-%02d", 1900+$time[5],$time[4]+1,$time[3];
    my $filename = "testcases-$date.$format->{extension}";
    
    my $disp = "inline";
    # We set CSV files to be downloaded, as they are designed for importing
    # into other programs.
    if ( $format->{'extension'} eq "csv" || $format->{'extension'} eq "xml" ){
        $disp = "attachment";
        $vars->{'displaycolumns'} = Testopia::TestCase::fields;
    }

    # Suggest a name for the bug list if the user wants to save it as a file.
    print $cgi->header(-type => $format->{'ctype'},
                       -content_disposition => "$disp; filename=$filename");
                                           
    $template->process($format->{'template'}, $vars)
        || ThrowTemplateError($template->error());
        
}