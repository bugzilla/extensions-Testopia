# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# This Source Code Form is "Incompatible With Secondary Licenses", as
# defined by the Mozilla Public License, v. 2.0.

package Bugzilla::Extension::Testopia::Admin;

use strict;
use warnings;

use Bugzilla::Constants;
use Bugzilla::Util;
use Bugzilla::Error;

use Bugzilla::Extension::Testopia::TestPlan;

sub report {
    my ($vars) = @_;
    my $input = Bugzilla->input_params;
    my $template = Bugzilla->template;
    my $plan = Bugzilla::Extension::Testopia::TestPlan->new({});
    $vars->{plan} = $plan;

    Bugzilla->login(LOGIN_REQUIRED);

    my $cgi = Bugzilla->cgi;
    print $cgi->header();

    # Make sure user is a Bugzilla admin.
    ThrowUserError('testopia-read-only', { 'object' => {'type' => 'Testopia administration'}})
        unless Bugzilla->user->in_group('admin');

    my $action = $input->{'action'} || '';
    my $item = $input->{'item'} || '';

    if ($item ne 'plan_type') {
        $template->process('testopia/admin/show.html.tmpl', $vars)
          or ThrowTemplateError($template->error());
    }
    elsif ($action eq 'edit') {
        my $type_id = $input->{'type_id'};
        detaint_natural($type_id);
        # Make sure test id exists.
        $vars->{'type'} = $plan->plan_type_ref($type_id)
          || ThrowUserError("invalid-test-id-non-existent", {'id' => $type_id, 'type' => 'Plan Type'});
        $template->process("testopia/admin/plantypes/edit.html.tmpl", $vars)
          or ThrowTemplateError($template->error());
    }
    elsif ($action eq 'doedit') {
        my $type_id = $input->{'type_id'};
        my $type_name = $input->{'name'} || '';
        my $type_desc = $input->{'description'} || '';

        # Type name is required.
        ThrowUserError('testopia-missing-required-field', {'field' => 'name'}) if $type_name eq '';
        detaint_natural($type_id);

        # Make sure test id exists.
        ThrowUserError("invalid-test-id-non-existent", {'id' => $type_id, 'type' => 'Plan Type'})
          unless $plan->plan_type_ref($type_id);
        trick_taint($type_name);
        trick_taint($type_desc);

        $plan->update_plan_type($type_id, $type_name, $type_desc);
        $template->process("testopia/admin/plantypes/show.html.tmpl", $vars)
          or ThrowTemplateError($template->error());
    }
    elsif ($action eq 'add') {
        $template->process("testopia/admin/plantypes/add.html.tmpl", $vars)
          or ThrowTemplateError($template->error());
    }
    elsif ($action eq 'doadd') {
        my $type_name = $input->{'name'} || '';
        my $type_desc = $input->{'description'} || '';

        # Type name is required
        ThrowUserError('testopia-missing-required-field', {'field' => 'name'}) if $type_name eq '';
        trick_taint($type_name);
        trick_taint($type_desc);

        # Type name must be unique
        ThrowUserError('testopia-name-not-unique', {'object' => 'Plan Type', 'name' => $type_name})
          if $plan->check_plan_type($type_name);

        $plan->add_plan_type($type_name, $type_desc);
        $template->process("testopia/admin/plantypes/show.html.tmpl", $vars)
          || ThrowTemplateError($template->error());
    }
    else {
        $template->process("testopia/admin/plantypes/show.html.tmpl", $vars)
          || ThrowTemplateError($template->error());
    }
}

1;
