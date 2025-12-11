# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# This Source Code Form is "Incompatible With Secondary Licenses", as
# defined by the Mozilla Public License, v. 2.0.

package Bugzilla::Extension::Testopia::CaseRun;

use strict;
use warnings;

use Bugzilla::Constants;
use Bugzilla::Error;
use Bugzilla::Util;
use Bugzilla::User;

use Bugzilla::Extension::Testopia::Util;
use Bugzilla::Extension::Testopia::TestCaseRun;
use Bugzilla::Extension::Testopia::Constants;
use JSON;

sub report {
    my ($vars) = @_;
    my $input = Bugzilla->input_params;
    my $cgi = Bugzilla->cgi;
    my $template = Bugzilla->template;

    Bugzilla->error_mode(ERROR_MODE_AJAX);
    Bugzilla->login(LOGIN_REQUIRED);

    my $caserun;
    my $action = $input->{'action'} || '';

    if ($input->{'caserun_id'}) {
        $caserun = Bugzilla::Extension::Testopia::TestCaseRun->new($input->{'caserun_id'});
    }
    elsif ($input->{'run_id'}) {
        $caserun = Bugzilla::Extension::Testopia::TestCaseRun->new(
          $input->{'run_id'}, $input->{'case_id'}, $input->{'build_id'}, $input->{'env_id'});
    }
    else {
        print $cgi->header;
        ThrowUserError('testopia-missing-parameter', {'param' => 'caserun_id or case_id and run_id'});
    }

    if ($action eq 'update_build') {
        print $cgi->header;
        ThrowUserError("testopia-read-only", {'object' => $caserun}) unless $caserun->canedit;
        my $build_id = $input->{'build_id'};
        detaint_natural($build_id);
        validate_test_id($build_id, 'build');

        $caserun = $caserun->switch($build_id, $caserun->environment->id);

        print "{'success': true, caserun:" . $caserun->TO_JSON ."}";
    }

    elsif ($action eq 'update_environment') {
        print $cgi->header;
        ThrowUserError("testopia-read-only", {'object' => $caserun}) unless $caserun->canedit;
        my $environment_id = $input->{'caserun_env'};
        detaint_natural($environment_id);
        validate_test_id($environment_id, 'environment');

        $caserun = $caserun->switch($caserun->build->id, $environment_id);

        print "{'success': true, caserun:" . $caserun->TO_JSON ."}";
    }

    elsif ($action eq 'update_status') {
        print $cgi->header;
        ThrowUserError("testopia-read-only", {'object' => $caserun}) unless $caserun->canedit;
        my $status_id = $input->{'status_id'};

        detaint_natural($status_id);

        $caserun->set_status($status_id, $input->{'update_bug'});

        print "{'success': true}";
    }

    elsif ($action eq 'update_note') {
        print $cgi->header;
        ThrowUserError("testopia-read-only", {'object' => $caserun}) unless $caserun->canedit;
        my $note = $input->{'note'};

        trick_taint($note);
        $caserun->append_note($note);

        print "{'success': true}";
    }

    elsif ($action eq 'update_assignee') {
        print $cgi->header;
        ThrowUserError("testopia-read-only", {'object' => $caserun}) unless $caserun->canedit;
        my $assignee_id;
        if ($input->{'assignee'}) {
            $assignee_id = login_to_id(trim($input->{'assignee'}),'THROW_ERROR');
        }

        $caserun->set_assignee($assignee_id);

        print "{'success': true}";
    }

    elsif ($action eq 'update_sortkey') {
        print $cgi->header;
        ThrowUserError("testopia-read-only",
            {'object' => $caserun}) unless $caserun->canedit;

        $caserun->set_sortkey($input->{'sortkey'});

        print "{'success': true}";
    }

    elsif ($action eq 'update_priority') {
        print $cgi->header;
        ThrowUserError("testopia-read-only", {'object' => $caserun}) unless $caserun->canedit;

        $caserun->set_priority($input->{'priority'});
        $caserun->update();

        print "{'success': true, caserun:" . $caserun->TO_JSON ."}";
    }

    elsif ($action eq 'update_category') {
        print $cgi->header;
        ThrowUserError("testopia-read-only", {'object' => $caserun}) unless $caserun->canedit;

        $caserun->case->set_category($input->{'category'});
        $caserun->case->update();

        print "{'success': true, caserun:" . $caserun->TO_JSON ."}";
    }

    elsif ($action eq 'getbugs') {
        print $cgi->header;
        ThrowUserError("testopia-read-only", {'object' => $caserun}) unless $caserun->canedit;
        my $bugs = [];
        push(@$bugs, { summary => $_->short_desc, bug_id => $_->bug_id }) foreach @{$caserun->bugs};

        print '{"bugs":' . to_json($bugs) . '}';
    }

    elsif ($action eq 'gettext') {
        unless ($caserun->canview) {
            print $cgi->header;
            ThrowUserError("testopia-permission-denied", {'object' => $caserun});
        }

        my $text = $caserun->case->text;
        $text->{'notes'} = $caserun->notes;
        $text->{'case_id'} = $caserun->case->id;
        $text->{'summary'} = $caserun->case->summary;

        $vars->{'text'} = $text;

        print $cgi->header(-type => 'text/xml');
        $template->process("testopia/case/text.xml.tmpl", $vars)
          || ThrowTemplateError($template->error());
    }

    elsif ($action eq 'gethistory') {
        print $cgi->header;
        ThrowUserError("testopia-permission-denied", {'object' => $caserun}) unless $caserun->canview;

        print '{"records":' . to_json($caserun->get_history) . '}';
    }

    else {
        print $cgi->redirect('page.cgi?id=tr_show_run.html');
    }
}

1;
