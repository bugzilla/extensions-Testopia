#!/usr/bin/perl -wT
# -*- Mode: perl; indent-tabs-mode: nil -*-
#
# The contents of this file are subject to the Mozilla Public
# License Version 1.1 (the "License"); you may not use this file
# except in compliance with the License. You may obtain a copy of
# the License at http://www.mozilla.org/MPL/
#
# Software distributed under the License is distributed on an "AS
# IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
# implied. See the License for the specific language governing
# rights and limitations under the License.
#
# The Original Code is the Bugzilla Test Runner System.
#
# The Initial Developer of the Original Code is Maciej Maczynski.
# Portions created by Maciej Maczynski are Copyright (C) 2001
# Maciej Maczynski. All Rights Reserved.
#
# Contributor(s): Maciej Maczynski <macmac@xdsnet.pl>
#                 Ed Fuentetaja <efuentetaja@acm.org>
#                 Greg Hendricks <ghendricks@novell.com>

use strict;
use lib qw(. lib);

use Bugzilla;
use Bugzilla::Constants;
use Bugzilla::Error;
use Bugzilla::Util;

BEGIN { Bugzilla->extensions }

use Bugzilla::Extension::Testopia::Util;
use Bugzilla::Extension::Testopia::Table;
use Bugzilla::Extension::Testopia::Constants;
use Bugzilla::Extension::Testopia::TestPlan;

my $vars = {};
my $template = Bugzilla->template;

Bugzilla->login(LOGIN_REQUIRED);

my $cgi = Bugzilla->cgi;

my $plan_id = trim(Bugzilla->cgi->param('plan_id'));

unless ($plan_id){
  print $cgi->header;
  $vars->{'form_action'} = 'tr_show_plan.cgi';
  $template->process("testopia/plan/choose.html.tmpl", $vars) 
      || ThrowTemplateError($template->error());
  exit;
}

my $plan = Bugzilla::Extension::Testopia::TestPlan->new($plan_id);
ThrowUserError("invalid-test-id-non-existent", {'type' => 'plan', id => $plan_id}) unless $plan;
ThrowUserError("testopia-permission-denied", {'object' => $plan}) unless $plan->canview;

$vars->{'table'} = Bugzilla::Extension::Testopia::Table->new('plan', 'tr_list_plans.cgi', $cgi);
$vars->{'plan'} = $plan;

my $format = $template->get_format("testopia/plan/show", scalar $cgi->param('format'), scalar $cgi->param('ctype'));
my $disp = "inline";
# We set CSV files to be downloaded, as they are designed for importing
# into other programs.
if ( $format->{'extension'} =~ /(csv|xml)/ ){
    $disp = "attachment";
    $vars->{'displaycolumns'} = Bugzilla::Extension::Testopia::TestCase::fields;
    $vars->{'table'} = $plan->test_cases;
    $vars->{'show_footer'} = 1;
}

# Suggest a name for the file if the user wants to save it as a file.
my @time = localtime(time());
my $date = sprintf "%04d-%02d-%02d", 1900+$time[5],$time[4]+1,$time[3];
my $filename = "testplan_$plan_id-$date.$format->{extension}";
print $cgi->header(-type => $format->{'ctype'},
                   -content_disposition => "$disp; filename=$filename");
    
$vars->{'percentage'} = \&percentage;

$template->process($format->{'template'}, $vars) ||
    ThrowTemplateError($template->error());
