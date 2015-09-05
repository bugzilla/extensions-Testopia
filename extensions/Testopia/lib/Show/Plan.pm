# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# This Source Code Form is "Incompatible With Secondary Licenses", as
# defined by the Mozilla Public License, v. 2.0.

package Bugzilla::Extension::Testopia::Show::Plan;

use strict;
use warnings;

use Bugzilla::Constants;
use Bugzilla::Error;
use Bugzilla::Util;

use Bugzilla::Extension::Testopia::Constants;
use Bugzilla::Extension::Testopia::Util qw(percentage);
use Bugzilla::Extension::Testopia::Table;
use Bugzilla::Extension::Testopia::TestCase;
use Bugzilla::Extension::Testopia::TestPlan;

sub report {
    my ($vars) = @_;
    my $input = Bugzilla->input_params;
    my $template = Bugzilla->template;
    my $cgi = Bugzilla->cgi;

    Bugzilla->login(LOGIN_REQUIRED);

    my $plan_id = trim($input->{'plan_id'});

    unless ($plan_id) {
        print $cgi->header;
        $vars->{'form_action'} = 'plan.cgi?id=tr_show_plan.html';
        $template->process("testopia/plan/choose.html.tmpl", $vars)
            || ThrowTemplateError($template->error());
        exit;
    }

    my $plan = Bugzilla::Extension::Testopia::TestPlan->new($plan_id);
    ThrowUserError("invalid-test-id-non-existent", {'type' => 'plan', id => $plan_id}) unless $plan;
    ThrowUserError("testopia-permission-denied", {'object' => $plan}) unless $plan->canview;

    $vars->{'table'} = Bugzilla::Extension::Testopia::Table->new('plan', 'page.cgi?id=tr_list_plans.html', $cgi);
    $vars->{'plan'} = $plan;

    my $format = $template->get_format("testopia/plan/show", scalar $input->{'format'}, scalar $input->{'ctype'});
    my $disp = "inline";
    # We set CSV files to be downloaded, as they are designed for importing
    # into other programs.
    if ($format->{'extension'} =~ /(csv|xml)/) {
        $disp = "attachment";
        $vars->{'displaycolumns'} = Bugzilla::Extension::Testopia::TestCase::fields;
        $vars->{'table'} = $plan->test_cases;
        $vars->{'show_footer'} = 1;
    }

    # Suggest a name for the file if the user wants to save it as a file.
    my @time = localtime(time());
    my $date = sprintf "%04d-%02d-%02d", 1900+$time[5],$time[4]+1,$time[3];
    my $filename = "testplan_$plan_id-$date.$format->{extension}";
    print $cgi->header( -type => $format->{'ctype'},
                        -content_disposition => "$disp; filename=$filename");

    $vars->{'percentage'} = \&percentage;

    $template->process($format->{'template'}, $vars) ||
        ThrowTemplateError($template->error());
}

1;
