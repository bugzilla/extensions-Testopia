# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# This Source Code Form is "Incompatible With Secondary Licenses", as
# defined by the Mozilla Public License, v. 2.0.

package Bugzilla::Extension::Testopia::Show::Run;

use strict;
use warnings;

use Bugzilla::Constants;
use Bugzilla::Error;
use Bugzilla::Util;

use Bugzilla::Extension::Testopia::Constants;
use Bugzilla::Extension::Testopia::Util;
use Bugzilla::Extension::Testopia::Table;
use Bugzilla::Extension::Testopia::TestRun;
use Bugzilla::Extension::Testopia::TestCaseRun;
use Bugzilla::Extension::Testopia::TestCase;

sub report {
    my ($vars) = @_;
    my $input = Bugzilla->input_params;
    my $template = Bugzilla->template;
    my $cgi = Bugzilla->cgi;

    Bugzilla->login(LOGIN_REQUIRED);

    print $cgi->header;

    my $run_id = trim($input->{'run_id'} || '');

    unless ($run_id) {
        $template->process("testopia/run/choose.html.tmpl", $vars)
            || ThrowTemplateError($template->error());
        exit;
    }

    my $run = Bugzilla::Extension::Testopia::TestRun->new($run_id);
    ThrowUserError("invalid-test-id-non-existent", {'type' => 'run', id => $run_id}) unless $run;
    ThrowUserError("testopia-permission-denied", {'object' => $run}) unless $run->canview;

    $vars->{'table'} = Bugzilla::Extension::Testopia::Table->new('run', 'page.cgi?id=tr_list_runs.html', $cgi);
    $vars->{'caserun'} = Bugzilla::Extension::Testopia::TestCaseRun->new({});
    $vars->{'case'} = Bugzilla::Extension::Testopia::TestCase->new({});
    $vars->{'run'} = $run;

    $template->process("testopia/run/show.html.tmpl", $vars)
        || ThrowTemplateError($template->error());
}

1;
