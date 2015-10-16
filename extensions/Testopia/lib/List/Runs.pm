# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# This Source Code Form is "Incompatible With Secondary Licenses", as
# defined by the Mozilla Public License, v. 2.0.

package Bugzilla::Extension::Testopia::List::Runs;
use strict;
use warnings;

use Bugzilla::Error;
use Bugzilla::Constants;
use Bugzilla::Util;

use Bugzilla::Extension::Testopia::Util;
use Bugzilla::Extension::Testopia::Search;
use Bugzilla::Extension::Testopia::Table;
use Bugzilla::Extension::Testopia::TestCaseRun;
use Bugzilla::Extension::Testopia::TestPlan;
use Bugzilla::Extension::Testopia::TestRun;
use Bugzilla::Extension::Testopia::Constants;

sub report {
    my ($vars) = @_;
    my $input = Bugzilla->input_params;
    my $template = Bugzilla->template;
    my $cgi = Bugzilla->cgi;

    my $user = Bugzilla->login(LOGIN_REQUIRED);

    # prevent DOS attacks from multiple refreshes of large data
    $::SIG{TERM} = 'DEFAULT';
    $::SIG{PIPE} = 'DEFAULT';

    print $cgi->header;

    my $action = $input->{'action'} || '';
    if ($action eq 'update') {
        Bugzilla->error_mode(ERROR_MODE_AJAX);

        my @run_ids = split(',', $input->{'ids'});
        ThrowUserError('testopia-none-selected', {'object' => 'run'}) unless scalar @run_ids;

        my @uneditable;
        foreach my $p (@run_ids) {
            my $run = Bugzilla::Extension::Testopia::TestRun->new($p);
            next unless $run;

            unless ($run->canedit) {
                push @uneditable, $run;
                next;
            }

            $run->set_manager($input->{'manager'}) if $input->{'manager'};
            $run->set_build($input->{'build'}) if $input->{'build'};
            $run->set_environment($input->{'environment'}) if $input->{'environment'};
            $run->set_target_pass($input->{'target_pass'}) if exists $cgi->{'target_pass'};
            $run->set_target_completion($input->{'target_completion'}) if exists $cgi->{'target_completion'};

            $run->update();
        }

        ThrowUserError('testopia-update-failed', {'object' => 'run', 'list' => join(',',@uneditable)})
          if scalar @uneditable;
        print "{'success': true}";
    }
    elsif ($action eq 'clone') {
        Bugzilla->error_mode(ERROR_MODE_AJAX);

        my @run_ids = split(',', $input->{'ids'});
        ThrowUserError('testopia-none-selected', {'object' => 'run'}) unless scalar @run_ids;

        my %planseen;
        foreach my $planid (split(",", $input->{'plan_ids'})) {
            validate_test_id($planid, 'plan');
            my $plan = Bugzilla::Extension::Testopia::TestPlan->new($planid);
            ThrowUserError('testopia-read-only', {'object' => $plan}) unless $plan->canedit;
            $planseen{$planid} = 1;
        }

        ThrowUserError('missing-plans-list') unless scalar keys %planseen;

        my $dbh = Bugzilla->dbh;

        my @newruns;
        my @failures;
        foreach my $run_id (@run_ids) {
            my $run = Bugzilla::Extension::Testopia::TestRun->new($run_id);
            next unless $run->canview;

            my $manager = $input->{'keep_run_manager'} ? $run->manager->id : $user->id;

            my $summary = $input->{'new_run_summary'} || $run->summary;
            my $build = $input->{'new_run_build'} || $run->build->id;
            my $env = $input->{'new_run_environment'} || $run->environment->id;

            trick_taint($summary) if $input->{'new_run_summary'};
            detaint_natural($build) if $input->{'new_run_build'};
            detaint_natural($env) if $input->{'new_run_environment'};
            validate_test_id($build, 'build') if $input->{'new_run_build'};
            validate_test_id($env, 'environment') if $input->{'new_run_environment'};

            my @caseruns;
            if ($input->{'copy_cases'}) {
                if ($input->{'case_list'}) {
                    foreach my $id (split(",", $input->{'case_list'})) {
                        my $caserun = Bugzilla::Extension::Testopia::TestCaseRun->new($id);
                        ThrowUserError('testopia-permission-denied', {'object' => $caserun})
                          unless $caserun->canview;
                        push @caseruns, $caserun;
                    }
                }
                else {
                    $input->{'current_tab'} = 'case_run';
                    $input->{'run_id'} = $run->id;
                    $input->{'viewall'} = 1;
                    $input->{'distinct'} = 1;
                    $cgi->delete('product_id');
                    $cgi->delete('plan_ids');

                    my $search = Bugzilla::Extension::Testopia::Search->new($cgi);
                    my $table = Bugzilla::Extension::Testopia::Table->new('case_run', 'tr_list_caseruns.cgi', $cgi, undef, $search->query);

                    @caseruns = @{$table->list};
                }
            }

            foreach my $plan_id (keys %planseen) {
                my $newrun = Bugzilla::Extension::Testopia::TestRun->new($run->clone($summary, $manager, $plan_id, $build, $env));

                if ($input->{'copy_tags'}) {
                    foreach my $tag (@{$run->tags}) {
                        $newrun->add_tag($tag->name);
                    }
                }

                if ($input->{'copy_filters'}) {
                    foreach my $f (@{$run->get_filters}) {
                        $newrun->copy_filter($f->{'name'}, $f->{'query'});
                    }
                }

                foreach my $cr (@caseruns) {
                    my $result = $newrun->add_case_run(
                        $cr->case_id,
                        $input->{'keep_indexes'} ? $cr->sortkey : undef,
                        $input->{'keep_statuses'} ? $cr->status_id : undef
                    );
                    push(@failures, $cr->case_id) unless $result;
                }
                push @newruns, $newrun->id;
            }
        }
        print "{'success': true, 'runlist': [" . join(", ", @newruns) . "], 'failures': [" . join(", ", @failures) . "]}";
    }
    elsif ($action eq 'delete') {
        Bugzilla->error_mode(ERROR_MODE_AJAX);
        my @run_ids = split(",", $input->{'run_ids'});
        my @uneditable;
        foreach my $id (@run_ids) {
            my $run = Bugzilla::Extension::Testopia::TestRun->new($id);
            unless ($run->candelete) {
                push @uneditable, $run;
                next;
            }

            $run->obliterate;
        }

        ThrowUserError('testopia-delete-failed', {'object' => 'run', 'list' => join(',',@uneditable)})
          if scalar @uneditable;
        print "{'success': true}";
    }
    else {
        $vars->{'qname'} = $input->{'qname'} if $input->{'qname'};
        $input->{'current_tab'} = 'run';
        $input->{'distinct'} = '1';

        my $search = Bugzilla::Extension::Testopia::Search->new($cgi);
        my $table = Bugzilla::Extension::Testopia::Table->new('run', 'page.cgi?id=tr_list_runs.html', $cgi, undef, $search->query);

        my $format = $template->get_format('testopia/run/list', scalar $input->{'format'}, scalar $input->{'ctype'});

        $vars->{'json'} = $table->to_ext_json;
        $template->process($format->{'template'}, $vars)
          or ThrowTemplateError($template->error());
    }
}

1;
