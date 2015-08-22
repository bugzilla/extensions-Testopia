# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# This Source Code Form is "Incompatible With Secondary Licenses", as
# defined by the Mozilla Public License, v. 2.0.

package Bugzilla::Extension::Testopia::List::Plans;

use strict;
use warnings;

use Bugzilla::Constants;
use Bugzilla::Error;

use Bugzilla::Extension::Testopia::Constants;
use Bugzilla::Extension::Testopia::Util;
use Bugzilla::Extension::Testopia::Search;
use Bugzilla::Extension::Testopia::Table;
use Bugzilla::Extension::Testopia::TestCase;
use Bugzilla::Extension::Testopia::TestPlan;

sub report {
    my ($vars) = @_;
    my $input = Bugzilla->input_params;
    my $template = Bugzilla->template;
    my $cgi = Bugzilla->cgi;

    Bugzilla->login(LOGIN_REQUIRED);

    # Prevent DOS attacks from multiple refreshes of large data
    $::SIG{TERM} = 'DEFAULT';
    $::SIG{PIPE} = 'DEFAULT';

    my $action = $input->{'action'} || '';

    if ($action eq 'update') {
        Bugzilla->error_mode(ERROR_MODE_AJAX);
        print $cgi->header;

        my @plan_ids = split(',', $input->{'ids'});
        my $total = scalar @plan_ids;

        ThrowUserError('testopia-none-selected', { object => 'plan' }) unless $total;

        my @uneditable;
        foreach my $p (@plan_ids) {
            my $plan = Bugzilla::Extension::Testopia::TestPlan->new($p);
            next unless $plan;

            unless ($plan->canedit) {
                push @uneditable, $p;
                next;
            }

            $plan->set_type($input->{'plan_type'}) if $input->{'plan_type'};
            $plan->update();
        }

        ThrowUserError('testopia-update-failed', { object => 'plans', list => join(',',@uneditable) }) if scalar @uneditable;
        print "{'success': true}";
    }
    else {
        my $format = $template->get_format("testopia/plan/list", scalar $input->{'format'}, scalar $input->{'ctype'});
        if ($format->{'extension'} =~ /(json)/) {
            Bugzilla->error_mode(ERROR_MODE_AJAX);
        }

        $vars->{'qname'} = $input->{'qname'} if $input->{'qname'};
        $input->{'current_tab'} = 'plan';
        $input->{'distinct'} = 1;

        my $search = Bugzilla::Extension::Testopia::Search->new($cgi);
        my $table = Bugzilla::Extension::Testopia::Table->new('plan', 'page.cgi?id=tr_list_plans.html', $cgi, undef, $search->query);
        my $disp = "inline";
        # We set CSV files to be downloaded, as they are designed for importing
        # into other programs.
        if ($format->{'extension'} =~ /(csv|xml)/) {
            $disp = "attachment";
            $vars->{'displaycolumns'} = Bugzilla::Extension::Testopia::TestCase::fields;
        }
        my @time = localtime(time());
        my $date = sprintf "%04d-%02d-%02d", 1900+$time[5],$time[4]+1,$time[3];
        my $filename = "testplans-$date.$format->{extension}";
        print $cgi->header( -type => $format->{'ctype'},
                            -content_disposition => "$disp; filename=$filename");

        $vars->{'json'} = $table->to_ext_json;
        $vars->{'table'} = $table;
        $template->process($format->{'template'}, $vars)
            || ThrowTemplateError($template->error());
    }
}

1;
