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

use strict;
use lib qw(. lib);

use Bugzilla;
use Bugzilla::Bug;
use Bugzilla::Util;
use Bugzilla::User;
use Bugzilla::Error;
use Bugzilla::Constants;

BEGIN { Bugzilla->extensions }

use Bugzilla::Extension::Testopia::Util;
use Bugzilla::Extension::Testopia::TestCase;
use Bugzilla::Extension::Testopia::Category;
use Bugzilla::Extension::Testopia::TestCaseRun;
use Bugzilla::Extension::Testopia::TestTag;
use Bugzilla::Extension::Testopia::Attachment;
use Bugzilla::Extension::Testopia::Constants;
use JSON;

Bugzilla->error_mode(ERROR_MODE_AJAX);
Bugzilla->login(LOGIN_REQUIRED);

my $cgi = Bugzilla->cgi;

my $action = $cgi->param('action') || '';

my $case = Bugzilla::Extension::Testopia::TestCase->new($cgi->param('case_id'));

unless ($case){
    print $cgi->header;
    ThrowUserError("invalid-test-id-non-existent", {'type' => 'case', id => $cgi->param('case_id')}) unless $case;
}

if ($action eq 'edit'){
    print $cgi->header;
    ThrowUserError("testopia-read-only", {'object' => $case}) unless $case->canedit;

    $case->set_alias($cgi->param('alias')) if exists $cgi->{param}->{'alias'} || exists $cgi->{'alias'};
    $case->set_category($cgi->param('category')) if $cgi->param('category');
    $case->set_case_status($cgi->param('status')) if $cgi->param('status');
    $case->set_priority($cgi->param('priority')) if $cgi->param('priority');
    $case->set_isautomated($cgi->param('isautomated') eq 'on' ? 1 : 0) if $cgi->param('isautomated');
    $case->set_script($cgi->param('script')) if exists $cgi->{param}->{'script'} || exists $cgi->{'script'};
    $case->set_arguments($cgi->param('arguments')) if exists $cgi->{param}->{'arguments'} || exists $cgi->{'arguments'};    
    $case->set_summary($cgi->param('summary')) if $cgi->param('summary');
    $case->set_requirement($cgi->param('requirement')) if exists $cgi->{param}->{'requirement'} || exists $cgi->{'requirement'};
    $case->set_dependson($cgi->param('tcdependson')) if exists $cgi->{param}->{'tcdependson'} || exists $cgi->{'tcdependson'};
    $case->set_blocks($cgi->param('tcblocks')) if exists $cgi->{param}->{'tcblocks'} || exists $cgi->{'tcblocks'};
    $case->set_default_tester($cgi->param('tester')) if exists $cgi->{param}->{'tester'} || exists $cgi->{'tester'};
    $case->set_estimated_time($cgi->param('estimated_time')) if exists $cgi->{param}->{'estimated_time'} || exists $cgi->{'estimated_time'};
    $case->set_sortkey($cgi->param('sortkey')) if exists $cgi->{param}->{'sortkey'};
    
    $case->add_to_run($cgi->param('addruns'));
    $case->add_tag($cgi->param('newtag'));
    $case->attach_bug($cgi->param('bugs'),$cgi->param('caserun_id'));
    
    $case->update();

    print "{'success': true, 'tcase': " . $case->TO_JSON ."}";
}

elsif ($action eq 'update_doc'){

    print $cgi->header;
    ThrowUserError("testopia-read-only", {'object' => $case}) unless $case->canedit;

    my $newtcaction = $cgi->param('tcaction') || '' if $cgi->param('tcaction');
    my $newtceffect = $cgi->param('tceffect') || '' if $cgi->param('tceffect');
    my $newtcsetup  = $cgi->param('tcsetup') || '' if $cgi->param('tcsetup');
    my $newtcbreakdown = $cgi->param('tcbreakdown') || '' if $cgi->param('tcbreakdown');

    if($case->diff_case_doc($newtcaction, $newtceffect, $newtcsetup, $newtcbreakdown) ne ''){
        $case->store_text($case->id, Bugzilla->user->id, $newtcaction, $newtceffect, $newtcsetup, $newtcbreakdown);
    }
}

elsif ($action eq 'link') {      
    print $cgi->header;      
    my @plans;      
    foreach my $id (split(',', $cgi->param('plan_ids'))){      
        my $plan = Bugzilla::Extension::Testopia::TestPlan->new($id);      
        ThrowUserError("testopia-read-only", {'object' => $plan}) unless $plan->canedit;      
        push @plans, $plan;      
    }      
    ThrowUserError('missing-plans-list') unless scalar @plans;      
     
    foreach my $plan (@plans){      
        $case->link_plan($plan->id);      
    }      
     
    delete $case->{'plans'};      
     
    print "{'success': true}";      
}

elsif ($action eq 'unlink'){
    print $cgi->header;
    my $plan_id = $cgi->param('plan_id');
    validate_test_id($plan_id, 'plan');
    ThrowUserError("testopia-read-only", {'object' => $case}) unless ($case->can_unlink_plan($plan_id));
    $case->unlink_plan($plan_id);
    
    print "{'success': true}";
}

elsif ($action eq 'detachbug'){
    print $cgi->header;
    ThrowUserError("testopia-read-only", {'object' => $case}) unless $case->canedit;
    my @buglist;
    foreach my $bug (split(/[\s,]+/, $cgi->param('bug_id'))){
        Bugzilla::Bug->check($bug);
        push @buglist, $bug;
    }
    foreach my $bug (@buglist){
        $case->detach_bug($bug);
    }
    print "{'success': true}";
}

elsif ($action eq 'delete'){
    print $cgi->header;
    ThrowUserError("testopia-no-delete", {'object' => $case}) unless $case->candelete;

    $case->obliterate;
    print "{'success': true}";
}

elsif ($action eq 'addcomponent' || $action eq 'removecomponent'){
    print $cgi->header;
    ThrowUserError("testopia-read-only", {'object' => $case}) unless $case->canedit;
    my $comp = $cgi->param('component_id');
    
    if ($action eq 'addcomponent'){
        foreach my $c (@{$case->components}){
            if ($c->id == $comp){
                exit;
            }   
        }
        $case->add_component($comp);
    }
    else {
        $case->remove_component($comp);
    }
    print "{'success': true}";
}

elsif ($action eq 'getbugs'){
    print $cgi->header;
    ThrowUserError("testopia-permission-denied", {'object' => $case}) unless $case->canview;
    my @bugs;
    foreach my $bug (@{$case->bugs}){
        push @bugs, { bug_id => $bug->bug_id, 
                      summary => $bug->short_desc,
                      case_run_id => $bug->{'case_run_id'},
                      status => $bug->bug_status,
                      resolution => $bug->resolution,
                      assignee => $bug->assigned_to->name,
                      severity => $bug->bug_severity,
                      priority => $bug->priority,
                      build => $bug->{'build'},
                      env  => $bug->{'env'},
                      run_id => $bug->{'run_id'} || '',                    
        };
    }
    my $json = new JSON;
    print "{'bugs':" .  $json->encode(\@bugs) . "}";
}

elsif ($action eq 'getplans'){
    print $cgi->header;
    ThrowUserError("testopia-permission-denied", {'object' => $case}) unless $case->canview;
    my @plans;
    foreach my $p (@{$case->plans}){
        push @plans, { plan_id => $p->id, plan_name => $p->name };
    }
    my $json = new JSON;
    print "{'plans':" .  $json->encode(\@plans) . "}";
}

elsif($action eq 'getcomponents'){
    print $cgi->header;
    ThrowUserError("testopia-permission-denied", {'object' => $case}) unless $case->canview;
    my @comps;
    foreach my $c (@{$case->components}){
        push @comps, {'id' => $c->id, 'name' => $c->name, 'product' => $c->product->name};
    }
    my $json = new JSON;
    print "{'comps':" . $json->encode(\@comps) . "}";   
    
}

elsif ($action eq 'case_to_bug'){
    unless ($case->canview){
        print $cgi->header;
        ThrowUserError("testopia-read-only", {'object' => $case});
    }
    $case->text;
    foreach my $field qw(action effect) {
        $case->{text}->{$field} =~ s/(<br[\s\/>]+|<p.*?>|<li.*?>)/\n/g;
        $case->{text}->{$field} =~ s/<.*?>//g;
        # Trivial HTML tag remover
        $case->{text}->{$field} =~ s/<[^>]*>//g;
        # And this basically reverses the html filter.
        $case->{text}->{$field} =~ s/\&#64;/@/g;
        $case->{text}->{$field} =~ s/\&lt;/</g;
        $case->{text}->{$field} =~ s/\&gt;/>/g;
        $case->{text}->{$field} =~ s/\&quot;/\"/g;
        $case->{text}->{$field} =~ s/\&nbsp;/ /g;
        $case->{text}->{$field} =~ s/\&amp;/\&/g;
    }
    my $vars;
    $vars->{'caserun'} = Bugzilla::Extension::Testopia::TestCaseRun->new($cgi->param('caserun_id')) if $cgi->param('caserun_id');
    $vars->{'case'} = $case;

    print $cgi->header(-type => 'text/xml');
    Bugzilla->template->process("testopia/case/new-bug.xml.tmpl", $vars) ||
        ThrowTemplateError(Bugzilla->template->error());
}

else {
    print $cgi->header;
    ThrowUserError("testopia-no-action");
}
