# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# This Source Code Form is "Incompatible With Secondary Licenses", as
# defined by the Mozilla Public License, v. 2.0.

package Bugzilla::Extension::Testopia::Builds;

use strict;
use warnings;

use Bugzilla::Util;
use Bugzilla::Constants;
use Bugzilla::Error;

use Bugzilla::Extension::Testopia::Constants;
use Bugzilla::Extension::Testopia::Build;
use Bugzilla::Extension::Testopia::TestRun;
use Bugzilla::Extension::Testopia::Util;
use Bugzilla::Extension::Testopia::Product;
use JSON;

sub report {
    my $input = Bugzilla->input_params;
    my $cgi = Bugzilla->cgi;

    Bugzilla->error_mode(ERROR_MODE_AJAX);
    Bugzilla->login(LOGIN_REQUIRED);

    my $action =  $input->{'action'} || '';
    my $product_id = $input->{'product_id'};

    print $cgi->redirect('page.cgi?id=tr_show_product.html&tab=build') unless $action;

    print $cgi->header;

    ThrowUserError('testopia-missing-parameter', {param => 'product_id'}) unless $product_id;

    my $product = Bugzilla::Extension::Testopia::Product->new($product_id);

    ######################
    ### Create a Build ###
    ######################
    if ($action eq 'add') {
        ThrowUserError('testopia-read-only', {'object' => $product}) unless $product->canedit;
        my $build = Bugzilla::Extension::Testopia::Build->create({
            product_id  => $product->id,
            name        => $input->{'name'} || '',
            description => $input->{'desc'} || $input->{'description'} || '',
            milestone   => $input->{'milestone'} || '---',
            isactive    => $input->{'isactive'} =~ /(1|true)/ ? 1 : 0,
        });

        print "{success: true, build_id: ". $build->id . "}";
    }

    ####################
    ### Edit a Build ###
    ####################
    elsif ($action eq 'edit') {
        ThrowUserError('testopia-read-only', {'object' => $product}) unless $product->canedit;
        my $build = Bugzilla::Extension::Testopia::Build->new($input->{'build_id'});

        $build->set_name($input->{'name'}) if $input->{'name'};
        $build->set_description($input->{'description'}) if $input->{'description'};
        $build->set_milestone($input->{'milestone'}) if $input->{'milestone'};
        $build->set_isactive($input->{'isactive'} =~ /(1|true)/ ? 1 : 0) if $input->{'isactive'};

        $build->update();
        print "{success: true}";
    }

    elsif ($action eq 'list') {
        ThrowUserError('testopia-permission-denied', {'object' => $product}) unless $product->canview;
        my $json = new JSON;
        my @builds;
        my $activeonly = $input->{'activeonly'};
        my $current = Bugzilla::Extension::Testopia::Build->new($input->{'current_build'} || {});
        my $out;

        trick_taint($activeonly) if $activeonly;

        foreach my $b (@{$product->builds($activeonly)}) {
            push @builds, $b if $b->id != $current->id;
        }
        unshift @builds, $current if defined $current->id;

        $out .= $_->TO_JSON . ',' foreach (@builds);
        chop ($out); # remove the trailing comma for IE

        print "{builds:[$out]}";
    }

    elsif ($action eq 'report') {
        ThrowUserError('testopia-permission-denied', {'object' => $product}) unless $product->canview;
        my ($vars) = @_;
        my $template = Bugzilla->template;

        my @build_ids = $input->{'build_ids'};
        my (@builds, @bug_ids);

        foreach my $g (@build_ids) {
            foreach my $id (split(',', $g)) {
                my $obj = Bugzilla::Extension::Testopia::Build->new($id);
                push @builds, $obj if $obj->product->canview;
                $obj->bugs;
                push @bug_ids, $obj->{'bug_list'};
            }
        }

        my $total = $builds[0]->case_run_count(undef, \@builds);
        my $passed = $builds[0]->case_run_count(PASSED, \@builds);
        my $failed = $builds[0]->case_run_count(FAILED, \@builds);
        my $blocked = $builds[0]->case_run_count(BLOCKED, \@builds);
        my $idle = $builds[0]->case_run_count(IDLE, \@builds);
        my $error = $builds[0]->case_run_count(ERROR, \@builds);

        my $completed = $passed + $failed + $blocked;

        my $unfinished = $total - $completed;
        my $unpassed = $completed - $passed;
        my $unfailed = $completed - $failed;
        my $unblocked = $completed - $blocked;

        $vars->{'total'} = $total;
        $vars->{'completed'} = $completed;
        $vars->{'passed'} = $passed;
        $vars->{'failed'} = $failed;
        $vars->{'blocked'} = $blocked;
        $vars->{'idle'} = $idle;
        $vars->{'error'} = $error;

        $vars->{'percent_completed'} = calculate_percent($total, $completed);
        $vars->{'percent_passed'} = calculate_percent($completed, $passed);
        $vars->{'percent_failed'} = calculate_percent($completed, $failed);
        $vars->{'percent_blocked'} = calculate_percent($completed, $blocked);
        $vars->{'percent_idle'} = calculate_percent($total, $idle);
        $vars->{'percent_error'} = calculate_percent($total, $error);

        $vars->{'builds'} = join(',', @build_ids);
        $vars->{'bugs'} = join(',', @bug_ids);
        $vars->{'bug_count'} = scalar @bug_ids;

        $template->process("testopia/reports/completion.html.tmpl", $vars)
            || ThrowTemplateError($template->error());
    }
}

1;
