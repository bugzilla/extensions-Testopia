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
use lib qw(. lib extensions/testopia/lib);

use Bugzilla;
use Bugzilla::Bug;
use Bugzilla::Util;
use Bugzilla::User;
use Bugzilla::Error;
use Bugzilla::Constants;
use Testopia::Search;
use Testopia::Util;
use Testopia::TestCaseRun;
use Testopia::Table;
use Testopia::Constants;
use JSON;

my $vars = {};

my $cgi = Bugzilla->cgi;
my $template = Bugzilla->template;

Bugzilla->login(LOGIN_REQUIRED);

# prevent DOS attacks from multiple refreshes of large data
$::SIG{TERM} = 'DEFAULT';
$::SIG{PIPE} = 'DEFAULT';

my $action = $cgi->param('action') || '';

if ($action eq 'update'){
    print $cgi->header;
    Bugzilla->error_mode(ERROR_MODE_AJAX);
    my @caseruns;
    my @uneditable;
    my $assignee_id; 
    my $status_id;
    my $note = $cgi->param('note');

    trick_taint($note) if $note;
    
    if ($cgi->param('applyall') eq 'true'){
        my $run = Testopia::TestRun->new($cgi->param('run_id'));
        exit if $run->stop_date;
        @caseruns = @{$run->current_caseruns()} if $run->canedit; 
        
    }
    else{
        foreach my $id (split(',', $cgi->param('ids'))){
            my $caserun = Testopia::TestCaseRun->new($id);
            if ($caserun->canedit){
                push @caseruns, $caserun;
            }
            else {
                push @uneditable, $caserun->case_id;
            } 
        }
    }
        
    $status_id = $cgi->param('status_id') if $cgi->param('status_id');
    $assignee_id = login_to_id(trim($cgi->param('assignee')),'THROW_ERROR') if $cgi->param('assignee');
    # If setting to running they can choose to make themselves the assignee.
    $assignee_id = Bugzilla->user->id if $cgi->param('reassign'); 
    detaint_natural($status_id);

    foreach my $cr (@caseruns){
        next if $cr->run->stop_date;
        $cr = $cr->switch($cgi->param('build_id')) if $cgi->param('build_id');
        $cr = $cr->switch($cr->build->id, $cgi->param('env_id')) if $cgi->param('env_id');
        $cr->set_status($status_id, $cgi->param('update_bug') eq 'true' ? 1 : 0) if $status_id;
        $cr->set_assignee($assignee_id) if $assignee_id;
        $cr->set_priority($cgi->param('priority')) if $cgi->param('priority');
        $cr->update();
        $cr->append_note($note);
    }

    ThrowUserError('testopia-update-failed', {'object' => 'case-run', 'list' => join(',',@uneditable)}) if (scalar @uneditable);
    exit unless scalar @caseruns; 
    
    my $run = $caseruns[0]->run;
    $vars->{'passed'} = $run->case_run_count(PASSED) / $run->case_run_count; 
    $vars->{'failed'} = $run->case_run_count(FAILED) / $run->case_run_count;
    $vars->{'blocked'} = $run->case_run_count(BLOCKED) / $run->case_run_count;
    $vars->{'complete'} = $run->percent_complete() . '%';
    $vars->{'success'} = JSON::true ;
    
    print to_json($vars);
}

elsif ($action eq 'delete'){
    print $cgi->header;
    Bugzilla->error_mode(ERROR_MODE_AJAX);
    my @case_ids;
    if ($cgi->param('ids')){
        @case_ids = $cgi->param('ids');
    }
    else {
        @case_ids = split(",", $cgi->param('caserun_ids'));
    }
    my @uneditable;
    foreach my $id (@case_ids){
        my $obj;
        if ($cgi->param('deltype') eq 'cr'){
            $obj = Testopia::TestCaseRun->new($id);
            unless ($obj->candelete){
                push @uneditable, $obj->id;
                next;
            }
            $obj->obliterate('single');
        }
        elsif ($cgi->param('deltype') eq 'cr_all'){
            $obj = Testopia::TestCaseRun->new($id);
            unless ($obj->candelete){
                push @uneditable, $obj->id;
                next;
            }
            $obj->obliterate();            
        }
        elsif ($cgi->param('deltype') eq 'plan_single'){
            my $cr = Testopia::TestCaseRun->new($id);
            $obj = $cr->case;
            unless ($obj->can_unlink_plan($cr->run->plan_id)){
                push @uneditable, $obj->id;
                next;
            }
            $obj->unlink_plan($cr->run->plan_id)
        }
        elsif ($cgi->param('deltype') eq 'all_plans'){
            my $cr = Testopia::TestCaseRun->new($id);
            $obj = $cr->case;
            unless ($obj->candelete){
                push @uneditable, $obj->id;
                next;
            }
            $obj->obliterate();
        }
        else{
            print "{'success': false}";
        }
    }

    ThrowUserError('testopia-delete-failed', {'object' => 'case-run', 'list' => join(',',@uneditable)}) if (scalar @uneditable);
    print "{'success': true}";
}

else {
    my $format = $template->get_format("testopia/caserun/list", scalar $cgi->param('format'), scalar $cgi->param('ctype'));
    
    $vars->{'qname'} = $cgi->param('qname') if $cgi->param('qname');
    $vars->{'report'} = $cgi->param('report_type') if $cgi->param('report_type');
    $vars->{'plan_ids'} = $cgi->param('plan_ids') if $cgi->param('plan_ids');
    $vars->{'run_ids'} = $cgi->param('run_ids') if $cgi->param('run_ids');
    
    # Take the search from the URL params and convert it to SQL
    $cgi->param('current_tab', 'case_run');
    $cgi->param('distinct', '1');
    my $search = Testopia::Search->new($cgi);
    my $table = Testopia::Table->new('case_run', 'tr_list_caseruns.cgi', $cgi, undef, $search->query);
    my $disp = "inline";
    # We set CSV files to be downloaded, as they are designed for importing
    # into other programs.
    if ( $format->{'extension'} =~ /(csv|xml)/ ){
        $disp = "attachment";
        $vars->{'displaycolumns'} = Testopia::TestCaseRun->fields;
    }
    my @time = localtime(time());
    my $date = sprintf "%04d-%02d-%02d", 1900+$time[5],$time[4]+1,$time[3];
    my $filename = "testresults-$date.$format->{extension}";
    print $cgi->header(-type => $format->{'ctype'},
                   -content_disposition => "$disp; filename=$filename");

    $vars->{'json'} = $table->to_ext_json;
    $vars->{'table'} = $table;

    $template->process($format->{'template'}, $vars)
        || ThrowTemplateError($template->error());
}
