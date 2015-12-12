# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# This Source Code Form is "Incompatible With Secondary Licenses", as
# defined by the Mozilla Public License, v. 2.0.

package Bugzilla::Extension::Testopia::Process::Run;

use strict;
use warnings;

use Bugzilla::Util;
use Bugzilla::Error;
use Bugzilla::Constants;

use Bugzilla::Extension::Testopia::Constants;
use Bugzilla::Extension::Testopia::Util;
use Bugzilla::Extension::Testopia::TestRun;
use JSON;

sub report {
    my $input = Bugzilla->input_params;
    my $cgi = Bugzilla->cgi;

    Bugzilla->error_mode(ERROR_MODE_AJAX);
    Bugzilla->login(LOGIN_REQUIRED);

    print $cgi->header;

    my $action = $input->{'action'} || '';

    my $run = Bugzilla::Extension::Testopia::TestRun->new($input->{'run_id'});

    ThrowUserError("invalid-test-id-non-existent", {'type' => 'run', id => $input->{'run_id'}}) unless $run;

    if ($action eq 'edit') {
        ThrowUserError("testopia-read-only", {'object' => $run}) unless $run->canedit;
        ThrowUserError("testopia-no-status", {field => 'status'}) if $input->{'status'} && !$run->canstatus;
        ThrowUserError("testopia-no-status", {field => 'manager'}) if $input->{'manager'} && !$run->canstatus;
        ThrowUserError("testopia-no-status", {field => 'target'}) if (exists $input->{'target_pass'}) && !$run->canstatus;
        ThrowUserError("testopia-no-status", {field => 'target'}) if (exists $input->{'target_completion'}) && !$run->canstatus;

        my $timestamp = $input->{'status'} ? undef : $run->stop_date;
        $timestamp = get_time_stamp() if (!$input->{'status'} || $input->{'status'} eq 'STOPPED') && !$run->stop_date;

        $run->set_summary($input->{'summary'}) if $input->{'summary'};
        $run->set_product_version($input->{'run_product_version'}) if $input->{'run_product_version'};
        $run->set_plan_text_version($input->{'plan_version'}) if $input->{'plan_version'};
        $run->set_build($input->{'build'}) if $input->{'build'};
        $run->set_environment($input->{'environment'}) if $input->{'environment'};
        $run->set_manager($input->{'manager'}) if $input->{'manager'};
        $run->set_notes($input->{'run_notes'}) if exists $input->{'run_notes'};
        $run->set_stop_date($timestamp) if $input->{'status'};
        $run->set_target_pass($input->{'target_pass'}) if exists $input->{'target_pass'};
        $run->set_target_completion($input->{'target_completion'}) if exists $input->{'target_completion'};

        $run->update();

        print "{success: true}";
    }
    elsif ($action eq 'delete') {
        ThrowUserError("testopia-no-delete", {'object' => $run}) unless $run->candelete;

        $run->obliterate;

        print "{'success': true}";
    }
    elsif ($action eq 'save_filter') {
        ThrowUserError('query_name_missing') unless $input->{'query_name'};
        ThrowUserError("testopia-read-only", {'object' => $run}) unless $run->canedit;

        $run->save_filter($input->{'query_name'});

        print "{'success':true}";
    }
    elsif ($action eq 'delete_filter') {
        ThrowUserError('query_name_missing') unless $input->{'query_name'};
        ThrowUserError("testopia-read-only", {'object' => $run}) unless $run->canedit;

        $run->delete_filter($input->{'query_name'});

        print "{'success':true}";
    }
    elsif ($action eq 'getfilters') {
        ThrowUserError("testopia-read-only", {'object' => $run}) unless $run->canedit;

        print "{'filters':" . to_json($run->get_filters) . "}";
    }
    else {
        ThrowUserError("testopia-no-action");
    }
}

1;
