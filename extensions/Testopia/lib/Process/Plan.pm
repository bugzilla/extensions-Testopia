# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# This Source Code Form is "Incompatible With Secondary Licenses", as
# defined by the Mozilla Public License, v. 2.0.

package Bugzilla::Extension::Testopia::Process::Plan;

use strict;
use warnings;

use Bugzilla::Constants;
use Bugzilla::Error;
use Bugzilla::Util;

use Bugzilla::Extension::Testopia::Util;
use Bugzilla::Extension::Testopia::Constants;
use Bugzilla::Extension::Testopia::TestPlan;
use Bugzilla::Extension::Testopia::TestCase;
use Bugzilla::Extension::Testopia::TestRun;
use Bugzilla::Extension::Testopia::Category;
use Bugzilla::Extension::Testopia::Build;
use Bugzilla::Extension::Testopia::Product;
use JSON;

sub report {
    my $input = Bugzilla->input_params;
    my $cgi = Bugzilla->cgi;

    Bugzilla->error_mode(ERROR_MODE_AJAX);
    my $user = Bugzilla->login(LOGIN_REQUIRED);

    print $cgi->header;
    my $action = $input->{'action'} || '';

    my $plan = Bugzilla::Extension::Testopia::TestPlan->new($input->{'plan_id'})
      || ThrowUserError("invalid-test-id-non-existent", {'type' => 'plan', id => $input->{'plan_id'}});

    if ($action eq 'archive' || $action eq 'unarchive') {
        ThrowUserError("testopia-read-only", {'object' => $plan}) unless $plan->canedit;

        $plan->toggle_archive($user->id);

        print '{"success" : true}';
        exit;
    }
    elsif ($action eq 'clone') {
        ThrowUserError("testopia-create-denied", {object => 'plan'}) unless $user->in_group('Testers');

        my $plan_name = $input->{'plan_name'};
        my $product_id = $input->{'product_id'};
        my $version = $input->{'prod_version'};
        my %case_lookup;
        my $product = Bugzilla::Extension::Testopia::Product->new($product_id);
        $product ||= $plan->product;

        trick_taint($plan_name);
        trick_taint($version);
        Bugzilla::Version->check({product => $product, name => $version});
        if ($input->{'copy_runs'}) {
            ThrowUserError("invalid-test-id-non-existent",
                {'id' => $input->{'new_run_build'}, 'type' => 'Build'}) unless $input->{'new_run_build'};
            ThrowUserError("invalid-test-id-non-existent",
                {'id' => $input->{'new_run_env'}, 'type' => 'Environment'}) unless $input->{'new_run_env'};
        }
        my $author = $input->{'keep_plan_author'} ? $plan->author->id : $user->id;
        my $newplanid = $plan->clone($plan_name, $author, $product->id, $version, $input->{'copy_doc'});
        my $newplan = Bugzilla::Extension::Testopia::TestPlan->new($newplanid);

        if ($input->{'copy_tags'}) {
            foreach my $tag (@{$plan->tags}) {
                $newplan->add_tag($tag->name);
            }
        }
        if ($input->{'copy_attachments'}) {
            foreach my $att (@{$plan->attachments}) {
                $att->link_plan($newplanid);
            }
        }
        if ($input->{'copy_perms'}) {
            $plan->copy_permissions($newplanid);
            $newplan->add_tester($author, TR_READ | TR_WRITE | TR_DELETE | TR_ADMIN)
              unless $input->{'keep_plan_author'};
            $newplan->derive_regexp_testers($plan->tester_regexp);
        }
        else {
            # Give the author admin rights
            $newplan->add_tester($author, TR_READ | TR_WRITE | TR_DELETE | TR_ADMIN);
            my $testers_regexp = Bugzilla->params->{'testopia-default-plan-testers-regexp'};
            $newplan->set_tester_regexp($testers_regexp, 3) if $testers_regexp;
            $newplan->derive_regexp_testers($testers_regexp);
        }
        if ($input->{'copy_cases'}) {
            my @cases = @{$plan->test_cases};
            my $total = scalar @cases;
            foreach my $case (@cases) {
                # Copy test cases creating new ones
                if ($input->{'make_copy'}) {
                    my $case_author = $input->{'keep_case_authors'} ? $case->author->id : $user->id;
                    my $case_tester = $input->{'keep_tester'} ? $case->default_tester->id : $user->id;
                    my $category;
                    if ($input->{'copy_categories'}) {
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
                    else {
                        if ($product->id == $plan->product_id) {
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
                    }

                    my $caseid = $case->copy($case_author, $case_tester, 1, $category->id);
                    my $newcase = Bugzilla::Extension::Testopia::TestCase->new($caseid);
                    $case_lookup{$case->id} = $caseid;
                    $newcase->link_plan($newplan->id, $caseid);

                    foreach my $tag (@{$case->tags}) {
                        $newcase->add_tag($tag->name);
                    }

                    foreach my $comp (@{$case->components}) {
                        $newcase->add_component($comp->{'id'});
                    }
                }
                else {
                    # Just create a link
                    $case->link_plan($newplan->id);
                }
            }
        }
        if ($input->{'copy_runs'}) {
            foreach my $run (@{$plan->test_runs}) {
                my $manager = $input->{'keep_run_managers'} ? $run->manager->id : $user->id;

                my $build = Bugzilla::Extension::Testopia::Build->new($input->{'new_run_build'});
                my $env = Bugzilla::Extension::Testopia::Build->new($input->{'new_run_env'});

                my $run_id = $run->clone($run->summary, $manager, $newplan->id, $build->id, $env->id);
                my $newrun = Bugzilla::Extension::Testopia::TestRun->new($run_id);

                $newrun->set_product_version($input->{'prod_version'});
                $newrun->update();

                if ($input->{'copy_run_tags'}) {
                    foreach my $tag (@{$run->tags}) {
                        $newrun->add_tag($tag->name);
                    }
                }
                if ($input->{'copy_run_cases'}) {
                    if ($input->{'make_copy'}) {
                        foreach my $cr (@{$run->current_caseruns}) {
                            if ($case_lookup{$cr->case_id}) {
                                $newrun->add_case_run($case_lookup{$cr->case_id}, $cr->sortkey);
                            }
                        }
                    }
                    else {
                        foreach my $cr (@{$run->current_caseruns}) {
                            $newrun->add_case_run($cr->case_id, $cr->sortkey);
                        }
                    }
                }
            }
        }
        print '{"success" : true, "plan_id" : ' . $newplan->id . "}";
        exit;
    }
    elsif ($action eq 'delete') {
        ThrowUserError("testopia-no-delete", {'object' => $plan}) unless $plan->candelete;

        $plan->obliterate;

        print '{"success" : true}';
        exit;
    }
    elsif ($action eq 'edit') {
        ThrowUserError("testopia-read-only", {'object' => $plan}) unless $plan->canedit;

        $plan->set_default_product_version($input->{'prod_version'}) if $input->{'prod_version'};
        $plan->set_type($input->{'type'}) if $input->{'type'};
        $plan->set_name($input->{'name'}) if $input->{'name'};

        if (exists $input->{"plandoc"}) {
            my $newdoc = $input->{"plandoc"};
            if ($plan->diff_plan_doc($newdoc)) {
                $plan->store_text($plan->id, $user->id, $newdoc);
            }
        }

        $plan->update();

        print '{"success" : true}';
        exit;
    }
    elsif ($action eq 'getfilter') {
        my $vars;
        $vars->{'case'} = Bugzilla::Extension::Testopia::TestCase->new({});
        $vars->{'plan'} = $plan;

        Bugzilla->template->process("testopia/case/filter.html.tmpl", $vars)
          || ThrowTemplateError(Bugzilla->template->error());
    }
    else {
        ThrowUserError("testopia-no-action");
    }
}

1;
