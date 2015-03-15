# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# This Source Code Form is "Incompatible With Secondary Licenses", as
# defined by the Mozilla Public License, v. 2.0.

package Bugzilla::Extension::Testopia::Reports::Product;

use strict;
use warnings;

use Bugzilla::Constants;
use Bugzilla::Error;
use Bugzilla::Util;

use Bugzilla::Extension::Testopia::Product;
use Bugzilla::Extension::Testopia::TestCaseRun;
use Bugzilla::Extension::Testopia::TestRun;

sub report {
    my ($vars) = @_;
    my $input = Bugzilla->input_params;
    my $template = Bugzilla->template;
    my $cgi = Bugzilla->cgi;

    Bugzilla->login(LOGIN_REQUIRED);

    my $product;
    if ($input->{'product_id'}) {
        $product = Bugzilla::Extension::Testopia::Product->new($input->{'product_id'});
        ThrowUserError('testopia-read-only', {'object' => $product}) unless $product->canedit;
        $vars->{'product'} = $product;
    }

    my $type = $input->{'type'} || '';
    my $action = $input->{'action'} || '';

    return if $action ne 'draw';
    return unless $product;

    my @data;
    my $caserun = Bugzilla::Extension::Testopia::TestCaseRun->new({});
    my $run = Bugzilla::Extension::Testopia::TestRun->new({});

    my @names;
    my @values;

    if ($type eq 'completion') {
        my $open = 0;
        my $closed = 0;
        foreach my $status (@{$caserun->get_status_list}) {
            if ($caserun->is_open_status($status->{'id'})) {
                $open += $run->case_run_count($status->{'id'}, undef, undef, [$product]);
            }
            else {
                $closed += $run->case_run_count($status->{'id'}, undef, undef, [$product]);
            }
        }
        push @names, 'Completed', 'Not Completed';
        push @values, $closed, $open;
        $vars->{'chart_title'} = 'Completion Percentage';
        $vars->{'colors'} = (['#56e871', '#FFFFFF']);

    }
    elsif ($type eq 'passrate') {
        foreach my $status (@{$caserun->get_status_list}) {
            if ($caserun->is_closed_status($status->{'id'})) {
                push @names, $status->{'name'};
                push @values, $run->case_run_count($status->{'id'}, undef, undef, [$product]);
            }
        }

        $vars->{'chart_title'} = 'Pass/Fail Rate';
        $vars->{'colors'} = (['#56e871', '#ed3f58','#e17a56']);

    }
    elsif ($type eq 'breakdown') {
        foreach my $status (@{$caserun->get_status_list}) {
            push @names, $status->{'name'};
            push @values, $run->case_run_count($status->{'id'}, undef, undef, [$product]);
        }
        $vars->{'chart_title'} = 'Status Breakdown';
        $vars->{'colors'} = (['#858aef', '#56e871', '#ed3f58', '#b8eae1', '#f1d9ab', '#e17a56']);
    }

    push @data, \@names;
    push @data, \@values;

    $vars->{'width'} = 200;
    $vars->{'height'} = 150;
    $vars->{'data'} = \@data;

    print $cgi->header;
    $template->process("testopia/reports/report-pie.png.tmpl", $vars)
      or ThrowTemplateError($template->error());
}

1;
