# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# This Source Code Form is "Incompatible With Secondary Licenses", as
# defined by the Mozilla Public License, v. 2.0.

package Bugzilla::Extension::Testopia::List::Cases;

use strict;
use warnings;

use Bugzilla::User;
use Bugzilla::Util;
use Bugzilla::Error;
use Bugzilla::Constants;

use Bugzilla::Extension::Testopia::Search;
use Bugzilla::Extension::Testopia::Util;
use Bugzilla::Extension::Testopia::Category;
use Bugzilla::Extension::Testopia::TestCase;
use Bugzilla::Extension::Testopia::TestCaseRun;
use Bugzilla::Extension::Testopia::TestPlan;
use Bugzilla::Extension::Testopia::TestTag;
use Bugzilla::Extension::Testopia::Table;
use Bugzilla::Extension::Testopia::Constants;

sub report {
    my ($vars) = @_;
    my $input = Bugzilla->input_params;
    my $template = Bugzilla->template;
    my $cgi = Bugzilla->cgi;

    my $user = Bugzilla->login(LOGIN_REQUIRED);

    # Determine the format in which the user would like to receive the output.
    # Uses the default format if the user did not specify an output format;
    # otherwise validates the user's choice against the list of available formats.
    my $format = $template->get_format('testopia/case/list', scalar $input->{'format'}, scalar $input->{'ctype'});
    my $action = $input->{'action'} || '';

    $::SIG{TERM} = 'DEFAULT';
    $::SIG{PIPE} = 'DEFAULT';

    ###############
    ### Actions ###
    ###############
    if ($action eq 'update') {
        Bugzilla->error_mode(ERROR_MODE_AJAX);
        print $cgi->header;
        my @case_ids = split(',', $input->{'ids'});
        ThrowUserError('testopia-none-selected', {'object' => 'case'}) unless scalar @case_ids;

        my (@uneditable, @runs, @bugs, @components, @addcomponents, @remcomponents);

        foreach my $runid (split(/[\s,]+/, $input->{'addruns'})) {
            validate_test_id($runid, 'run');
            push @runs, Bugzilla::Extension::Testopia::TestRun->new($runid);
        }

        foreach my $bugid (split(/[\s,]+/, $input->{'bugs'})) {
            Bugzilla::Bug->check($bugid);
            push @bugs, $bugid;
        }

        my @comps = $input->{"components"};
        foreach my $id (@comps) {
            detaint_natural($id);
            validate_selection($id, 'id', 'components');
            if ($input->{'comp_action'} eq 'add') {
                push @addcomponents, $id;
            }
            else {
                push @remcomponents, $id;
            }
        }

        foreach my $p (@case_ids) {
            my $case = Bugzilla::Extension::Testopia::TestCase->new($p);
            next unless $case;

            unless ($case->canedit) {
                push @uneditable, $case->id;
                next;
            }

            $case->set_requirement($input->{'requirement'}) if $input->{'requirement'};
            $case->set_case_status($input->{'status'}) if $input->{'status'};
            $case->set_priority($input->{'priority'}) if $input->{'priority'};
            $case->set_isautomated($input->{'isautomated'} eq 'on' ? 1 : 0) if $input->{'isautomated'};
            $case->set_script($input->{'script'}) if $input->{'script'};
            $case->set_arguments($input->{'arguments'}) if $input->{'arguments'};
            $case->set_category($input->{'category'}) if $input->{'category'};
            $case->set_default_tester($input->{'tester'}) if $input->{'tester'};

            $case->update();

            $case->add_component($_) foreach (@addcomponents);
            $case->remove_component($_) foreach (@remcomponents);

            # Add to runs
            foreach my $run (@runs) {
                $run->add_case_run($case->id, $case->sortkey) if $run->canedit;
            }

            $case->attach_bugs(\@bugs) if $input->{'bugs_action'} eq 'add';
            $case->detach_bugs(\@bugs) if $input->{'bugs_action'} eq 'remove';
        }
        ThrowUserError('testopia-update-failed', {'object' => 'case', 'list' => join(',',@uneditable)}) if scalar @uneditable;
        print "{'success': true}";
    }
    elsif ($action eq 'clone') {
        Bugzilla->error_mode(ERROR_MODE_AJAX);
        print $cgi->header;

        my @case_ids = split(',', $input->{'ids'});
        ThrowUserError('testopia-none-selected', {'object' => 'case'}) unless scalar @case_ids;

        my %planseen;
        foreach my $planid (split(",", $input->{'plan_ids'})) {
            validate_test_id($planid, 'plan');
            my $plan = Bugzilla::Extension::Testopia::TestPlan->new($planid);
            ThrowUserError('testopia-read-only', {'object' => $plan}) unless $plan->canedit;
            $planseen{$planid} = 1;
        }

        ThrowUserError('missing-plans-list') unless scalar keys %planseen;

        my $product = Bugzilla::Extension::Testopia::Product->new($input->{'product_id'});
        ThrowUserError('invalid-test-id-non-existent', {type => 'Product', id => $input->{'product_id'}}) unless $product;

        if ($input->{'copy_category'}) {
            ThrowUserError('testopia-read-only', {'object' => $product}) unless $product->canedit;
        }

        my @newcases;
        foreach my $id (@case_ids) {
            my $case = Bugzilla::Extension::Testopia::TestCase->new($id);
            next unless ($case && $case->canview);

            # Clone
            if ($input->{'copy_cases'}) {
                # Copy test cases creating new ones
                my $case_author = $input->{'keep_author'} ? $case->author->id : $user->id;
                my $case_tester = $input->{'keep_tester'} ? $case->default_tester->id : $user->id;
                my $category;
                if ($input->{'copy_category'}) {
                    my $category_id = check_case_category($case->category->name, $product);
                    if (!$category_id) {
                        $category = Bugzilla::Extension::Testopia::Category->create({
                            product_id  => $product->id,
                            name        => $case->category->name,
                            description => $case->category->description,
                        });
                    }
                    else {
                        $category = Bugzilla::Extension::Testopia::Category->new($category_id);
                    }
                }
                elsif ($product->id == $case->category->product_id) {
                    $category = $case->category;
                }
                else {
                    my @categories = @{$product->categories};
                    if (scalar @categories < 1) {
                        $category = Bugzilla::Extension::Testopia::Category->create({
                            product_id  => $product->id,
                            name        => '--default--',
                            description => 'Default product category for test cases',
                        });
                    }
                    else {
                        $category = $categories[0];
                    }
                }

                my $caseid = $case->copy($case_author, $case_tester, $input->{'copy_doc'} eq 'on' ? 1 : 0, $category->id);
                my $newcase = Bugzilla::Extension::Testopia::TestCase->new($caseid);
                push @newcases,  $newcase->id;

                foreach my $plan_id (keys %planseen) {
                    $newcase->link_plan($plan_id, $caseid);
                }

                if ($input->{'copy_attachments'}) {
                    foreach my $att (@{$case->attachments}) {
                        $att->link_case($newcase->id);
                    }
                }
                if ($input->{'copy_tags'}) {
                    foreach my $tag (@{$case->tags}) {
                        $newcase->add_tag($tag->name);
                    }
                }
                if ($input->{'copy_comps'}) {
                    foreach my $comp (@{$case->components}) {
                        $newcase->add_component($comp->{'id'});
                    }
                }
            }
            # Just create a link
            else {
                foreach my $plan_id (keys %planseen) {
                    $case->link_plan($plan_id);
                }
            }
        }
        print "{'success': true, 'tclist': [". join(", ", @newcases) ."]}";
    }
    elsif ($action eq 'delete') {
        Bugzilla->error_mode(ERROR_MODE_AJAX);
        print $cgi->header;

        my @case_ids = split(",", $input->{'case_ids'});
        my @uneditable;
        foreach my $id (@case_ids) {
            my $case = Bugzilla::Extension::Testopia::TestCase->new($id);
            next unless $case;
            unless ($case->candelete) {
                push @uneditable, $case->id;
                next;
            }
            $case->obliterate;
        }

        ThrowUserError('testopia-delete-failed', {'object' => 'case', 'list' => join(',', @uneditable)}) if scalar @uneditable;
        print "{'success': true}";
    }
    elsif ($action eq 'unlink') {
        Bugzilla->error_mode(ERROR_MODE_AJAX);
        print $cgi->header;
        my $plan_id = $input->{'plan_id'};
        validate_test_id($plan_id, 'plan');
        foreach my $id (split(",", $input->{'case_ids'})) {
            my $case = Bugzilla::Extension::Testopia::TestCase->new($id);
            if (scalar @{$case->plans} == 1) {
                ThrowUserError('testopia-read-only', {'object' => 'case'}) unless $case->candelete;
                $case->obliterate();
            }
            else {
                ThrowUserError('testopia-read-only', {'object' => 'case'}) unless $case->can_unlink_plan($plan_id);
                $case->unlink_plan($plan_id);
            }
        }
        print "{'success': true}";
    }
    elsif ($action eq 'update_bugs') {
        Bugzilla->error_mode(ERROR_MODE_AJAX);
        print $cgi->header;

        my @ids = split(",", $input->{'ids'});
        foreach my $id (@ids) {
            if ($input->{'type'} eq 'case') {
                my $case = Bugzilla::Extension::Testopia::TestCase->new($id);
                if ($input->{'bug_action'} eq 'attach') {
                    $case->attach_bug($input->{'bugs'}) if $case->canedit;
                }
                else {
                    $case->detach_bug($input->{'bugs'}) if $case->canedit;
                }
            }
            elsif ($input-{'type'} eq 'caserun') {
                my $caserun = Bugzilla::Extension::Testopia::TestCaseRun->new($id);
                if ($input->{'bug_action'} eq 'attach') {
                    $caserun->attach_bug($input->{'bugs'}, $id) if $caserun->canedit;
                }
                else {
                    $caserun->detach_bug($input->{'bugs'}) if $caserun->canedit;
                }
            }
        }
        print "{'success': true}";
    }
    else {
        $vars->{'qname'} = $input->{'qname'} if $input->{'qname'};
        $vars->{'report'} = $input->{'report_type'} if $input->{'report_type'};
        $vars->{'plan_ids'} = $input->{'plan_ids'} if $input->{'plan_ids'};
        $vars->{'run_ids'} = $input->{'run_ids'} if $input->{'run_ids'};

        $input->{'current_tab'} = 'case';
        $input->{'distinct'} = 1;
        my $search = Bugzilla::Extension::Testopia::Search->new($cgi);
        my $table = Bugzilla::Extension::Testopia::Table->new('case', 'page.cgi?id=tr_list_cases.html', $cgi, undef, $search->query);
        $vars->{'table'} = $table;
        if ($input->{'ctype'} eq 'json') {
            Bugzilla->error_mode(ERROR_MODE_AJAX);
            print $cgi->header;
            $vars->{'json'} = $table->to_ext_json;
            $template->process($format->{'template'}, $vars)
                || ThrowTemplateError($template->error());
            exit;
        }

        my @time = localtime(time());
        my $date = sprintf "%04d-%02d-%02d", 1900+$time[5],$time[4]+1,$time[3];
        my $filename = "testcases-$date.$format->{extension}";

        my $disp = "inline";
        # We set CSV files to be downloaded, as they are designed for importing
        # into other programs.
        if ($format->{'extension'} eq "csv" || $format->{'extension'} eq "xml") {
            $disp = "attachment";
            $vars->{'displaycolumns'} = Bugzilla::Extension::Testopia::TestCase::fields;
        }

        # Suggest a name for the bug list if the user wants to save it as a file.
        print $cgi->header(-type => $format->{'ctype'},
                           -content_disposition => "$disp; filename=$filename");

        $template->process($format->{'template'}, $vars)
            || ThrowTemplateError($template->error());

    }
}

1;
