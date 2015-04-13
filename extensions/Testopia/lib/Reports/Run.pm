# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# This Source Code Form is "Incompatible With Secondary Licenses", as
# defined by the Mozilla Public License, v. 2.0.

package Bugzilla::Extension::Testopia::Reports::Run;

use strict;
use warnings;

use Bugzilla::Constants;
use Bugzilla::Error;
use Bugzilla::Util;

use Bugzilla::Extension::Testopia::Report;
use Bugzilla::Extension::Testopia::Util;
use Bugzilla::Extension::Testopia::Constants;
use Bugzilla::Extension::Testopia::TestPlan;
use Bugzilla::Extension::Testopia::TestRun;
use Bugzilla::Extension::Testopia::Search;

use JSON;

sub report {
    my ($vars) = @_;
    my $input = Bugzilla->input_params;
    my $template = Bugzilla->template;
    my $cgi = Bugzilla->cgi;
    my $dbh = Bugzilla->dbh;

    Bugzilla->login(LOGIN_REQUIRED);

    my $type = $input->{'type'} || '';
    $vars->{'qname'} = $input->{'qname'};

    if ($type eq 'completion') {
        print $cgi->header;
        my @r = $input->{'run_ids'};
        my @p = $input->{'plan_ids'};

        my ($runs, $run_ids) = get_runs(\@p, \@r);
        my @runs = @$runs;
        my @run_ids = @$run_ids;

        my $bugs = $dbh->selectcol_arrayref("
            SELECT DISTINCT tcb.bug_id
              FROM test_case_bugs AS tcb
              INNER JOIN test_case_runs AS tcr ON tcr.case_run_id = tcb.case_run_id
              INNER JOIN bugs on tcb.bug_id = bugs.bug_id
              INNER JOIN test_case_run_status AS tcrs ON tcr.case_run_status_id = tcrs.case_run_status_id
                WHERE tcr.run_id in (" . join (',',@run_ids) . ") AND tcr.iscurrent = 1",
            {"Slice" =>{}});

        my $total = $runs[0]->case_run_count(undef, \@runs);
        my $passed = $runs[0]->case_run_count(PASSED, \@runs);
        my $failed = $runs[0]->case_run_count(FAILED, \@runs);
        my $blocked = $runs[0]->case_run_count(BLOCKED, \@runs);

        my $completed = $passed + $failed + $blocked;
        my $unfinished = $total - $completed;

        $vars->{'total'} = $total;
        $vars->{'completed'} = $completed;
        $vars->{'uncompleted'} = $unfinished;
        $vars->{'passed'} = $passed;
        $vars->{'failed'} = $failed;
        $vars->{'blocked'} = $blocked;

        $vars->{'percent_completed'} = calculate_percent($total, $completed);
        $vars->{'percent_passed'} = calculate_percent($completed, $passed);
        $vars->{'percent_failed'} = calculate_percent($completed, $failed);
        $vars->{'percent_blocked'} = calculate_percent($completed, $blocked);
        $vars->{'percent_idle'} = calculate_percent($total, $unfinished);

        $vars->{'runs'} = join(',',@run_ids);
        $vars->{'plans'} = join(',',@p);
        $vars->{'bugs'} = join(',',@$bugs);
        $vars->{'bug_count'} = scalar @$bugs;
        $vars->{'run_count'} = scalar @run_ids;

        $template->process("testopia/reports/completion.html.tmpl", $vars)
            || ThrowTemplateError($template->error());
        exit;
    }
    elsif ($type eq 'status') {
        print $cgi->header;
        my @r = $input->{'run_ids'};
        my @p = $input->{'plan_ids'};

        my ($runs, $run_ids) = get_runs(\@p, \@r);
        my @runs = @$runs;
        my @run_ids = @$run_ids;

        $vars->{'total'} = $runs[0]->case_run_count(undef, \@runs);
        $vars->{'passed'} = $runs[0]->case_run_count(PASSED, \@runs);
        $vars->{'failed'} = $runs[0]->case_run_count(FAILED, \@runs);
        $vars->{'blocked'} = $runs[0]->case_run_count(BLOCKED, \@runs);
        $vars->{'idle'} = $runs[0]->case_run_count(IDLE, \@runs);
        $vars->{'running'} = $runs[0]->case_run_count(RUNNING, \@runs);
        $vars->{'paused'} = $runs[0]->case_run_count(PAUSED, \@runs);
        $vars->{'error'} = $runs[0]->case_run_count(ERROR, \@runs);

        $vars->{'runs'} = join(',',@run_ids);
        $vars->{'plans'} = join(',',@p);
        $vars->{'run_count'} = scalar @run_ids;

        $template->process("testopia/reports/status.html.tmpl", $vars)
            || ThrowTemplateError($template->error());
        exit;
    }
    elsif ($type eq 'execution') {
        print $cgi->header;
        my @run_ids  = $input->{'run_ids'};
        my @plan_ids = $input->{'plan_ids'};
        my @runs;

        foreach my $g (@plan_ids) {
            foreach my $id (split(',', $g)) {
                my $obj = Bugzilla::Extension::Testopia::TestPlan->new($id);
                push @runs, @{$obj->test_runs} if $obj && $obj->canview;
            }
        }
        foreach my $g (@run_ids) {
            foreach my $id (split(',', $g)) {
                my $obj = Bugzilla::Extension::Testopia::TestRun->new($id);
                push @runs, $obj if $obj && $obj->canview;
            }
        }

        unless (scalar @runs) {
            print "<b>No runs found</b>";
            exit;
        }

        @run_ids = ();
        foreach my $r (@runs) {
            push @run_ids, $r->id;
        }
        my $chfieldfrom = trim(lc($input->{'chfieldfrom'})) || '';
        my $chfieldto = trim(lc($input->{'chfieldto'})) || '';
        my $tester;
        if ($input->{'tester'}) {
            $tester = login_to_id(trim($input->{'tester'}), 'THROW_ERROR');
        }

        trick_taint($chfieldfrom);
        trick_taint($chfieldto);
        my $sql_chfrom = Bugzilla::Extension::Testopia::Search::SqlifyDate($chfieldfrom);
        my $sql_chto   = Bugzilla::Extension::Testopia::Search::SqlifyDate($chfieldto);

        my $total = $runs[0]->case_run_count_by_date($sql_chfrom, $sql_chto, undef, $tester, \@runs);
        my $passed = $runs[0]->case_run_count_by_date($sql_chfrom, $sql_chto, PASSED, $tester, \@runs);
        my $failed = $runs[0]->case_run_count_by_date($sql_chfrom, $sql_chto, FAILED, $tester, \@runs);
        my $blocked = $runs[0]->case_run_count_by_date($sql_chfrom, $sql_chto, BLOCKED, $tester, \@runs);

        $vars->{'total'} = $total;
        $vars->{'passed'} = $passed;
        $vars->{'failed'} = $failed;
        $vars->{'blocked'} = $blocked;
        $vars->{'closed_from'} = $chfieldfrom;
        $vars->{'closed_to'} = $chfieldto;
        $vars->{'closed_from_converted'} = $sql_chfrom;
        $vars->{'closed_to_converted'} = $sql_chto;
        $vars->{'runs'} = \@run_ids;
        $vars->{'plans'} = \@plan_ids;

        $template->process("testopia/reports/execution.html.tmpl", $vars)
            || ThrowTemplateError($template->error());
        exit;
    }
    elsif ($type eq 'bar') {
        $vars->{'total'} = $input->{'t'};

        $vars->{'colors'} = (['#B8A0D2', '#56e871', '#ed3f58','#e17a56']);
        $vars->{'legend'} = ["Complete", "PASSED", "FAILED", "BLOCKED"];
        $vars->{'data'} = [
            ["CASES"],
            [$input->{'c'}],
            [$input->{'p'}],
            [$input->{'f'}],
            [$input->{'b'}],
        ];

        print $cgi->header;
        $template->process("testopia/reports/completion.png.tmpl", $vars)
            || ThrowTemplateError($template->error());
        exit;
    }
    elsif ($type eq 'bug') {
        print $cgi->header;
        my @run_ids  = $input->{'run_ids'};
        my @plan_ids = $input->{'plan_ids'};
        my @runs;

        foreach my $g (@plan_ids) {
            foreach my $id (split(',', $g)) {
                my $obj = Bugzilla::Extension::Testopia::TestPlan->new($id);
                push @runs, @{$obj->test_runs} if $obj && $obj->canview;
            }
        }
        foreach my $g (@run_ids) {
            foreach my $id (split(',', $g)) {
                my $obj = Bugzilla::Extension::Testopia::TestRun->new($id);
                push @runs, $obj if $obj && $obj->canview;
            }
        }

        unless (scalar @runs) {
            print "<b>No runs found</b>";
            exit;
        }
        my @ids;
        foreach my $r (@runs) {
            push @ids, $r->id;
        }
        my $ref = $dbh->selectall_arrayref("
            SELECT DISTINCT tcb.bug_id, bugs.bug_status, bugs.bug_severity, tcr.run_id, tcr.case_id, tcrs.name AS case_status
              FROM test_case_bugs AS tcb
              INNER JOIN test_case_runs AS tcr ON tcr.case_run_id = tcb.case_run_id
              INNER JOIN bugs on tcb.bug_id = bugs.bug_id
              INNER JOIN test_case_run_status AS tcrs ON tcr.case_run_status_id = tcrs.case_run_status_id
                WHERE tcr.run_id in (" . join (',',@ids) . ") AND tcr.iscurrent = 1",
            {"Slice" =>{}});

        my $json = new JSON;
        print "{Result:";
        print $json->encode($ref);
        print "}";
        exit;
    }
    elsif ($type eq 'bug_grid') {
        $vars->{'runs'} = $input->{'run_ids'};
        $vars->{'plans'} = $input->{'plan_ids'};
        $vars->{'stripheader'} = 1 if $input->{'noheader'};
        $vars->{'uid'} = rand(10000);

        print $cgi->header;
        $template->process("testopia/reports/bug-count.html.tmpl", $vars)
            || ThrowTemplateError($template->error());
        exit;
    }
    elsif ($type eq 'priority') {
        print $cgi->header;
        my @r = $input->{'run_ids'};
        my @plans = $input->{'plan_ids'};

        my ($runs, $run_ids) = get_runs(\@plans, \@r);
        my @runs = @$runs;
        my @run_ids = @$run_ids;
        my $priorities;

        foreach my $p (@{$dbh->selectall_arrayref("SELECT id, value FROM priority")}) {
            $priorities->{$p->[1]}->{'total'} = $runs[0]->case_run_count_by_priority($p->[0], undef, \@runs);
            $priorities->{$p->[1]}->{'passed'} = $runs[0]->case_run_count_by_priority($p->[0], PASSED, \@runs);
            $priorities->{$p->[1]}->{'failed'} = $runs[0]->case_run_count_by_priority($p->[0], FAILED, \@runs);
            $priorities->{$p->[1]}->{'blocked'} = $runs[0]->case_run_count_by_priority($p->[0], BLOCKED, \@runs);
            $priorities->{$p->[1]}->{'idle'} = $runs[0]->case_run_count_by_priority($p->[0], IDLE, \@runs);
            $priorities->{$p->[1]}->{'running'} = $runs[0]->case_run_count_by_priority($p->[0], RUNNING, \@runs);
            $priorities->{$p->[1]}->{'paused'} = $runs[0]->case_run_count_by_priority($p->[0], PAUSED, \@runs);
            $priorities->{$p->[1]}->{'error'} = $runs[0]->case_run_count_by_priority($p->[0], ERROR, \@runs);
        }
        $vars->{'priorities'} = $priorities;
        $vars->{'runs'} = join(',',@run_ids);
        $vars->{'plans'} = join(',',@plans);
        $vars->{'run_count'} = scalar @run_ids;

        $template->process("testopia/reports/priority-breakdown.html.tmpl", $vars)
            || ThrowTemplateError($template->error());
        exit;
    }
    elsif ($type eq 'worst') {
        print $cgi->header;
        my @r = $input->{'run_ids'};
        my @plans = $input->{'plan_ids'};

        my ($runs, $run_ids) = get_runs(\@plans, \@r);
        my @runs = @$runs;
        my @run_ids = @$run_ids;
        my $json = new JSON;

        my $query =
            "SELECT COUNT(case_id) AS top, case_id
              FROM test_case_runs
              WHERE run_id IN (". join(',', @$run_ids) .")
                AND case_run_status_id = ?
              GROUP BY case_id
              ORDER BY top DESC
              LIMIT ?";

        my $ref = $dbh->selectall_arrayref($query, {'Slice' =>{}}, (FAILED, 10));
        foreach my $row (@$ref) {
            $row->{top} = int($row->{top});
        }

        $vars->{'stripheader'} = 1 if $input->{'noheader'};
        $vars->{'uid'} = int(rand(10000));
        $vars->{'data'} = $json->encode($ref);
        $vars->{'runs'} = join(',',@run_ids);
        $vars->{'plans'} = join(',',@plans);

        $template->process("testopia/reports/bar.html.tmpl", $vars)
            || ThrowTemplateError($template->error());
        exit;
    }

    $input->{'current_tab', 'run'};
    $input->{'viewall', 1};
    my $report = Bugzilla::Extension::Testopia::Report->new('run', 'tr_list_runs.cgi', $cgi);
    $vars->{'report'} = $report;

    ### From Bugzilla report.cgi by Gervase Markham
    my $formatparam = $input->{'format'};
    my $report_action = $input->{'report_action'};
    if ($report_action eq "data") {
        # So which template are we using? If action is "wrap", we will be using
        # no format (it gets passed through to be the format of the actual data),
        # and either report.csv.tmpl (CSV), or report.html.tmpl (everything else).
        # report.html.tmpl produces an HTML framework for either tables of HTML
        # data, or images generated by calling report.cgi again with action as
        # "plot".
        $formatparam =~ s/[^a-zA-Z\-]//g;
        trick_taint($formatparam);
        $vars->{'format'} = $formatparam;
        $formatparam = '';
    }
    elsif ($report_action eq "plot") {
        # If action is "plot", we will be using a format as normal (pie, bar etc.)
        # and a ctype as normal (currently only png.)
        $vars->{'cumulate'} = $input->{'cumulate'} ? 1 : 0;
        $vars->{'x_labels_vertical'} = $input->{'x_labels_vertical'} ? 1 : 0;
        $vars->{'data'} = $report->{'image_data'};
    }
    else {
        ThrowUserError("unknown_action", {action => $input->{'report_action'}});
    }

    my $format = $template->get_format("testopia/reports/report", $formatparam,
    scalar($input->{'ctype'}));

    my @time = localtime(time());
    my $date = sprintf "%04d-%02d-%02d", 1900+$time[5],$time[4]+1,$time[3];
    my $filename = "report-" . $date . ".$format->{extension}";

    my $disp = "inline";
    # We set CSV files to be downloaded, as they are designed for importing
    # into other programs.
    if ($format->{'extension'} eq "csv" || $format->{'extension'} eq "xml") {
        $disp = "attachment";
    }

    print $cgi->header( -type => $format->{'ctype'},
                        -content_disposition => "$disp; filename=$filename");

    $vars->{'time'} = $date;
    $template->process("$format->{'template'}", $vars)
        || ThrowTemplateError($template->error());
}

1;
