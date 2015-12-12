# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# This Source Code Form is "Incompatible With Secondary Licenses", as
# defined by the Mozilla Public License, v. 2.0.

package Bugzilla::Extension::Testopia::Process::Case;

use strict;
use warnings;

use Bugzilla::Bug;
use Bugzilla::Util;
use Bugzilla::User;
use Bugzilla::Error;
use Bugzilla::Constants;

use Bugzilla::Extension::Testopia::Util;
use Bugzilla::Extension::Testopia::TestCase;
use Bugzilla::Extension::Testopia::Category;
use Bugzilla::Extension::Testopia::TestCaseRun;
use Bugzilla::Extension::Testopia::TestTag;
use Bugzilla::Extension::Testopia::Attachment;
use Bugzilla::Extension::Testopia::Constants;
use JSON;

sub report {
    my $input = Bugzilla->input_params;
    my $template = Bugzilla->template;
    my $cgi = Bugzilla->cgi;

    Bugzilla->error_mode(ERROR_MODE_AJAX);
    my $user = Bugzilla->login(LOGIN_REQUIRED);

    my $action = $input->{'action'} || '';

    my $case = Bugzilla::Extension::Testopia::TestCase->new($input->{'case_id'});

    unless ($case) {
        print $cgi->header;
        ThrowUserError("invalid-test-id-non-existent", {'type' => 'case', id => $input->{'case_id'}});
    }

    if ($action eq 'edit') {
        print $cgi->header;
        ThrowUserError("testopia-read-only", {'object' => $case}) unless $case->canedit;

        $case->set_alias($input->{'alias'}) if exists $input->{'alias'};
        $case->set_category($input->{'category'}) if $input->{'category'};
        $case->set_case_status($input->{'status'}) if $input->{'status'};
        $case->set_priority($input->{'priority'}) if $input->{'priority'};
        $case->set_isautomated($input->{'isautomated'} eq 'on' ? 1 : 0) if $input->{'isautomated'};
        $case->set_script($input->{'script'}) if exists $input->{'script'};
        $case->set_arguments($input->{'arguments'}) if exists $input->{'arguments'};
        $case->set_summary($input->{'summary'}) if $input->{'summary'};
        $case->set_requirement($input->{'requirement'}) if exists $input->{'requirement'};
        $case->set_dependson($input->{'tcdependson'}) if exists $input->{'tcdependson'};
        $case->set_blocks($input->{'tcblocks'}) if exists $input->{'tcblocks'};
        $case->set_default_tester($input->{'tester'}) if exists $input->{'tester'};
        $case->set_estimated_time($input->{'estimated_time'}) if exists $input->{'estimated_time'};
        $case->set_sortkey($input->{'sortkey'}) if exists $input->{'sortkey'};

        $case->add_to_run($input->{'addruns'});
        $case->add_tag($input->{'newtag'});
        $case->attach_bug($input->{'bugs'}, $input->{'caserun_id'});

        $case->update();

        print "{'success': true, 'tcase': " . $case->TO_JSON ."}";
    }
    elsif ($action eq 'update_doc') {
        print $cgi->header;
        ThrowUserError("testopia-read-only", {'object' => $case}) unless $case->canedit;

        my $newtcaction = $input->{'tcaction'} || '';
        my $newtceffect = $input->{'tceffect'} || '';
        my $newtcsetup  = $input->{'tcsetup'} || '';
        my $newtcbreakdown = $input->{'tcbreakdown'} || '';

        if ($case->diff_case_doc($newtcaction, $newtceffect, $newtcsetup, $newtcbreakdown)) {
            $case->store_text($case->id, $user->id, $newtcaction, $newtceffect, $newtcsetup, $newtcbreakdown);
        }
    }
    elsif ($action eq 'link') {
        print $cgi->header;
        my @plans;
        foreach my $id (split(',', $input->{'plan_ids'})) {
            my $plan = Bugzilla::Extension::Testopia::TestPlan->new($id);
            ThrowUserError("testopia-read-only", {'object' => $plan}) unless $plan->canedit;
            push @plans, $plan;
        }
        ThrowUserError('missing-plans-list') unless scalar @plans;

        foreach my $plan (@plans) {
            $case->link_plan($plan->id);
        }

        delete $case->{'plans'};

        print "{'success': true}";
    }
    elsif ($action eq 'unlink') {
        print $cgi->header;
        my $plan_id = $input->{'plan_id'};
        validate_test_id($plan_id, 'plan');
        ThrowUserError("testopia-read-only", {'object' => $case}) unless ($case->can_unlink_plan($plan_id));
        $case->unlink_plan($plan_id);

        print "{'success': true}";
    }
    elsif ($action eq 'detachbug') {
        print $cgi->header;
        ThrowUserError("testopia-read-only", {'object' => $case}) unless $case->canedit;
        my @buglist;
        foreach my $bug (split(/[\s,]+/, $input->{'bug_id'})) {
            Bugzilla::Bug->check($bug);
            push @buglist, $bug;
        }
        foreach my $bug (@buglist) {
            $case->detach_bug($bug);
        }
        print "{'success': true}";
    }
    elsif ($action eq 'delete') {
        print $cgi->header;
        ThrowUserError("testopia-no-delete", {'object' => $case}) unless $case->candelete;

        $case->obliterate;
        print "{'success': true}";
    }
    elsif ($action eq 'addcomponent' || $action eq 'removecomponent') {
        print $cgi->header;
        ThrowUserError("testopia-read-only", {'object' => $case}) unless $case->canedit;
        my $comp = $input->{'component_id'};

        if ($action eq 'addcomponent') {
            foreach my $c (@{$case->components}) {
                if ($c->id == $comp) {
                    exit;
                }
            }
            $case->add_component($comp);
        }
        else {
            $case->remove_component($comp);
        }
        print "{'success': true}";
    }
    elsif ($action eq 'getbugs') {
        print $cgi->header;
        ThrowUserError("testopia-permission-denied", {'object' => $case}) unless $case->canview;
        my @bugs;
        foreach my $bug (@{$case->bugs}) {
            push @bugs, {
                bug_id => $bug->bug_id,
                summary => $bug->short_desc,
                case_run_id => $bug->{'case_run_id'},
                status => $bug->bug_status,
                resolution => $bug->resolution,
                assignee => $bug->assigned_to->name,
                severity => $bug->bug_severity,
                priority => $bug->priority,
                build => $bug->{'build'},
                env  => $bug->{'env'},
                run_id => $bug->{'run_id'} || '',
            };
        }
        my $json = new JSON;
        print "{'bugs':" .  $json->encode(\@bugs) . "}";
    }
    elsif ($action eq 'getplans') {
        print $cgi->header;
        ThrowUserError("testopia-permission-denied", {'object' => $case}) unless $case->canview;
        my @plans;
        foreach my $p (@{$case->plans}) {
            push @plans, { plan_id => $p->id, plan_name => $p->name };
        }
        my $json = new JSON;
        print "{'plans':" .  $json->encode(\@plans) . "}";
    }
    elsif($action eq 'getcomponents') {
        print $cgi->header;
        ThrowUserError("testopia-permission-denied", {'object' => $case}) unless $case->canview;
        my @comps;
        foreach my $c (@{$case->components}) {
            push @comps, {'id' => $c->id, 'name' => $c->name, 'product' => $c->product->name};
        }
        my $json = new JSON;
        print "{'comps':" . $json->encode(\@comps) . "}";
    }
    elsif ($action eq 'case_to_bug') {
        unless ($case->canview) {
            print $cgi->header;
            ThrowUserError("testopia-read-only", {'object' => $case});
        }
        my $vars;
        $vars->{'caserun'} = Bugzilla::Extension::Testopia::TestCaseRun->new($input->{'caserun_id'}) if $input->{'caserun_id'};
        $vars->{'case'} = $case;

        print $cgi->header(-type => 'text/xml');
        Bugzilla->template->process("testopia/case/new-bug.xml.tmpl", $vars)
          || ThrowTemplateError(Bugzilla->template->error());
    }
    else {
        print $cgi->header;
        ThrowUserError("testopia-no-action");
    }
}

1;
