# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# This Source Code Form is "Incompatible With Secondary Licenses", as
# defined by the Mozilla Public License, v. 2.0.

package Bugzilla::Extension::Testopia::List::CaseRuns;

use strict;
use warnings;

use Bugzilla::Util;
use Bugzilla::User;
use Bugzilla::Error;
use Bugzilla::Constants;

use Bugzilla::Extension::Testopia::Search;
use Bugzilla::Extension::Testopia::Util;
use Bugzilla::Extension::Testopia::TestCaseRun;
use Bugzilla::Extension::Testopia::Table;
use Bugzilla::Extension::Testopia::Constants;
use Bugzilla::Extension::Testopia::TestRun;

use JSON;

sub report {
    my ($vars) = @_;
    my $input = Bugzilla->input_params;
    my $template = Bugzilla->template;
    my $cgi = Bugzilla->cgi;

    my $user = Bugzilla->login(LOGIN_REQUIRED);

    # prevent DOS attacks from multiple refreshes of large data
    $::SIG{TERM} = 'DEFAULT';
    $::SIG{PIPE} = 'DEFAULT';

    my $action = $input->{'action'} || '';

    if ($action eq 'update') {
        print $cgi->header;
        Bugzilla->error_mode(ERROR_MODE_AJAX);
        my (@caseruns, @uneditable, $assignee_id, $status_id);
        my $note = $input->{'note'};

        trick_taint($note) if $note;

        if ($input->{'applyall'} && $input->{'applyall'} eq 'true') {
            my $run = Bugzilla::Extension::Testopia::TestRun->new($input->{'run_id'});
            exit if $run->stop_date;
            @caseruns = @{$run->current_caseruns()} if $run->canedit;
        }
        else {
            foreach my $id (split(',', $input->{'ids'})) {
                my $caserun = Bugzilla::Extension::Testopia::TestCaseRun->new($id);
                if ($caserun->canedit) {
                    push @caseruns, $caserun;
                }
                else {
                    push @uneditable, $caserun->case_id;
                }
            }
        }

        if ($input->{'status_id'}) {
            $status_id = $input->{'status_id'};
            detaint_natural($status_id);
        }
        $assignee_id = login_to_id(trim($input->{'assignee'}), 'THROW_ERROR') if $input->{'assignee'};
        # If setting to running they can choose to make themselves the assignee.
        $assignee_id = $user->id if $input->{'reassign'};

        foreach my $cr (@caseruns) {
            next if $cr->run->stop_date;
            $cr = $cr->switch($input->{'build_id'}) if $input->{'build_id'};
            $cr = $cr->switch($cr->build->id, $input->{'env_id'}) if $input->{'env_id'};
            $cr->set_status($status_id, $input->{'update_bug'} eq 'true' ? 1 : 0) if $status_id;
            $cr->set_assignee($assignee_id) if $assignee_id;
            $cr->set_priority($input->{'priority'}) if $input->{'priority'};
            $cr->update();
            $cr->append_note($note);
        }

        if (scalar @uneditable) {
            ThrowUserError('testopia-update-failed', {'object' => 'case-run',
                                                      'list' => join(',', @uneditable)})
        }
        return unless scalar @caseruns;

        my $run = $caseruns[0]->run;
        $vars->{'passed'} = $run->case_run_count(PASSED) / $run->case_run_count;
        $vars->{'failed'} = $run->case_run_count(FAILED) / $run->case_run_count;
        $vars->{'blocked'} = $run->case_run_count(BLOCKED) / $run->case_run_count;
        $vars->{'complete'} = $run->percent_complete() . '%';
        $vars->{'success'} = JSON::true;

        print to_json($vars);
    }
    elsif ($action eq 'delete') {
        print $cgi->header;
        Bugzilla->error_mode(ERROR_MODE_AJAX);
        my @case_ids;
        if ($input->{'ids'}) {
            @case_ids = @{ $input->{'ids'} };
        }
        else {
            @case_ids = split(",", $input->{'caserun_ids'});
        }
        my @uneditable;
        foreach my $id (@case_ids) {
            my $obj;
            if ($input->{'deltype'} eq 'cr') {
                $obj = Bugzilla::Extension::Testopia::TestCaseRun->new($id);
                unless ($obj->candelete) {
                    push @uneditable, $obj->id;
                    next;
                }
                $obj->obliterate('single');
            }
            elsif ($input->{'deltype'} eq 'cr_all') {
                $obj = Bugzilla::Extension::Testopia::TestCaseRun->new($id);
                unless ($obj->candelete) {
                    push @uneditable, $obj->id;
                    next;
                }
                $obj->obliterate();
            }
            elsif ($input->{'deltype'} eq 'plan_single') {
                my $cr = Bugzilla::Extension::Testopia::TestCaseRun->new($id);
                $obj = $cr->case;
                unless ($obj->can_unlink_plan($cr->run->plan_id)) {
                    push @uneditable, $obj->id;
                    next;
                }
                $obj->unlink_plan($cr->run->plan_id)
            }
            elsif ($input->{'deltype'} eq 'all_plans') {
                my $cr = Bugzilla::Extension::Testopia::TestCaseRun->new($id);
                $obj = $cr->case;
                unless ($obj->candelete) {
                    push @uneditable, $obj->id;
                    next;
                }
                $obj->obliterate();
            }
            else {
                print "{'success': false}";
            }
        }

        if (scalar @uneditable) {
            ThrowUserError('testopia-delete-failed', {'object' => 'case-run',
                                                      'list'   => join(',', @uneditable)});
        }
        print "{'success': true}";
    }
    else {
        my $format = $template->get_format('testopia/caserun/list', $input->{'format'}, $input->{'ctype'});

        $vars->{'qname'} = $input->{'qname'} if $input->{'qname'};
        $vars->{'report'} = $input->{'report_type'} if $input->{'report_type'};
        $vars->{'plan_ids'} = $input->{'plan_ids'} if $input->{'plan_ids'};
        $vars->{'run_ids'} = $input->{'run_ids'} if $input->{'run_ids'};

        # Take the search from the URL params and convert it to SQL
        $input->{'current_tab'} = 'case_run';
        $input->{'distinct'} = 1;
        my $search = Bugzilla::Extension::Testopia::Search->new($cgi);
        my $table = Bugzilla::Extension::Testopia::Table->new('case_run', 'page.cgi?id=tr_list_caseruns.html',
                                                              $cgi, undef, $search->query);
        my $disp = "inline";
        # We set CSV files to be downloaded, as they are designed for importing
        # into other programs.
        if ($format->{'extension'} =~ /(csv|xml)/) {
            $disp = "attachment";
            $vars->{'displaycolumns'} = Bugzilla::Extension::Testopia::TestCaseRun->fields;
        }
        my @time = localtime(time());
        my $date = sprintf "%04d-%02d-%02d", 1900+$time[5],$time[4]+1,$time[3];
        my $filename = "testresults-$date.$format->{extension}";
        print $cgi->header( -type => $format->{'ctype'},
                            -content_disposition => "$disp; filename=$filename");

        $vars->{'json'} = $table->to_ext_json;
        $vars->{'table'} = $table;

        $template->process($format->{'template'}, $vars)
            || ThrowTemplateError($template->error());
    }
}

1;
