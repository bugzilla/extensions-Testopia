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
#                 Joel Smith <jsmith@novell.com>

use strict;
use lib qw(. lib);

use Bugzilla;
use Bugzilla::Util;
use Bugzilla::Error;
use Bugzilla::Constants;

BEGIN { Bugzilla->extensions }

use Bugzilla::Extension::Testopia::Constants;
use Bugzilla::Extension::Testopia::Util;
use Bugzilla::Extension::Testopia::TestRun;
use Bugzilla::Extension::Testopia::TestCaseRun;
use Bugzilla::Extension::Testopia::TestCase;
use Bugzilla::Extension::Testopia::Search;
use Bugzilla::Extension::Testopia::Table;

use JSON;

Bugzilla->error_mode(ERROR_MODE_AJAX);
Bugzilla->login(LOGIN_REQUIRED);

my $cgi = Bugzilla->cgi;
print $cgi->header;

my $action = $cgi->param('action') || '';
my $run = Bugzilla::Extension::Testopia::TestRun->new($cgi->param('run_id'));

ThrowUserError("invalid-test-id-non-existent", {'type' => 'run', id => $cgi->param('run_id')}) unless $run;

if ($action eq 'edit'){
    ThrowUserError("testopia-read-only", {'object' => $run}) unless $run->canedit;
    ThrowUserError("testopia-no-status", {field => 'status'}) if $cgi->param('status') && !$run->canstatus;
    ThrowUserError("testopia-no-status", {field => 'manager'}) if $cgi->param('manager') && !$run->canstatus;
    ThrowUserError("testopia-no-status", {field => 'target'}) if (exists $cgi->{'target_pass'} || exists $cgi->{param}->{'target_pass'}) && !$run->canstatus;
    ThrowUserError("testopia-no-status", {field => 'target'}) if (exists $cgi->{'target_completion'} || exists $cgi->{param}->{'target_completion'}) && !$run->canstatus;
    
    my $timestamp;
    $timestamp = $run->stop_date;
    $timestamp = undef if $cgi->param('status');
    $timestamp = get_time_stamp() if ($cgi->param('status') == 0 || $cgi->param('status') eq 'STOPPED') && !$run->stop_date;

    $run->set_summary($cgi->param('summary')) if $cgi->param('summary');
    $run->set_product_version($cgi->param('run_product_version')) if $cgi->param('run_product_version');
    $run->set_plan_text_version($cgi->param('plan_version')) if $cgi->param('plan_version');
    $run->set_build($cgi->param('build')) if $cgi->param('build');
    $run->set_environment($cgi->param('environment')) if $cgi->param('environment');
    $run->set_manager($cgi->param('manager')) if $cgi->param('manager');
    $run->set_notes($cgi->param('run_notes')) if exists $cgi->{'run_notes'} || exists $cgi->{param}->{'run_notes'};
    $run->set_stop_date($timestamp) if $cgi->param('status');
    $run->set_target_pass($cgi->param('target_pass')) if exists $cgi->{'target_pass'} || exists $cgi->{param}->{'target_pass'};
    $run->set_target_completion($cgi->param('target_completion')) if exists $cgi->{'target_completion'} || exists $cgi->{param}->{'target_completion'};
    
    $run->update();
    
    print "{success: true}";

}

elsif ($action eq 'delete'){
    ThrowUserError("testopia-no-delete", {'object' => $run}) unless ($run->candelete);
    
    $run->obliterate;
    
    print "{'success': true}";
}

elsif ($action eq 'save_filter'){
    ThrowUserError('query_name_missing') unless $cgi->param('query_name');
    ThrowUserError("testopia-read-only", {'object' => $run}) unless $run->canedit;
    
    $run->save_filter($cgi->param('query_name'));
    
    print "{'success':true}";
}

elsif ($action eq 'delete_filter'){
    ThrowUserError('query_name_missing') unless $cgi->param('query_name');
    ThrowUserError("testopia-read-only", {'object' => $run}) unless $run->canedit;
    
    $run->delete_filter($cgi->param('query_name'));
    
    print "{'success':true}";
}

elsif ($action eq 'getfilters'){
    ThrowUserError("testopia-read-only", {'object' => $run}) unless $run->canedit;
    print "{'filters':" . to_json($run->get_filters) . "}";
}

else {
    ThrowUserError("testopia-no-action");
}
    