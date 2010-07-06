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
# The Original Code is the Bugzilla Testopia System.
#
# The Initial Developer of the Original Code is Greg Hendricks.
# Portions created by Greg Hendricks are Copyright (C) 2006
# Novell. All Rights Reserved.
#
# Contributor(s): Greg Hendricks <ghendricks@novell.com>
#                 Jeff Dayley <jedayley@novell.com>
 
use strict;
use lib qw(. lib);

use Bugzilla;
use Bugzilla::Config;
use Bugzilla::Error;
use Bugzilla::Constants;
use Bugzilla::Util;

BEGIN { Bugzilla->extensions }

use Bugzilla::Extension::Testopia::Util;
use Bugzilla::Extension::Testopia::Search;
use Bugzilla::Extension::Testopia::Table;
use Bugzilla::Extension::Testopia::Constants;

my $vars = {};

my $cgi = Bugzilla->cgi;
my $template = Bugzilla->template;

Bugzilla->login(LOGIN_REQUIRED);

# prevent DOS attacks from multiple refreshes of large data
$::SIG{TERM} = 'DEFAULT';
$::SIG{PIPE} = 'DEFAULT';

my $action = $cgi->param('action') || '';

if ($action eq 'update'){
    Bugzilla->error_mode(ERROR_MODE_AJAX);
    print $cgi->header;
    my @plan_ids = split(',', $cgi->param('ids'));
    
    ThrowUserError('testopia-none-selected', {'object' => 'plan'}) unless (scalar @plan_ids);

    my $total = scalar @plan_ids;
    my @uneditable;
    foreach my $p (@plan_ids){
        my $plan = Bugzilla::Extension::Testopia::TestPlan->new($p);
        next unless $plan;
        
        unless ($plan->canedit){
            push @uneditable, $p;
            next;
        }
        
        $plan->set_type($cgi->param('plan_type')) if $cgi->param('plan_type');
        $plan->update();
        
    }
    
    ThrowUserError('testopia-update-failed', {'object' => 'plans', 'list' => join(',',@uneditable)}) if (scalar @uneditable);
    print "{'success': true}";    
}
else {
    my $format = $template->get_format("testopia/plan/list", scalar $cgi->param('format'), scalar $cgi->param('ctype'));
    if ( $format->{'extension'} =~ /(json)/ ){
        Bugzilla->error_mode(ERROR_MODE_AJAX);
    }
    
    $vars->{'qname'} = $cgi->param('qname') if $cgi->param('qname');
    $cgi->param('current_tab', 'plan');
    $cgi->param('distinct', '1');
    
    my $search = Bugzilla::Extension::Testopia::Search->new($cgi);
    my $table = Bugzilla::Extension::Testopia::Table->new('plan', 'tr_list_plans.cgi', $cgi, undef, $search->query);
    my $disp = "inline";
    # We set CSV files to be downloaded, as they are designed for importing
    # into other programs.
    if ( $format->{'extension'} =~ /(csv|xml)/ ){
        $disp = "attachment";
        $vars->{'displaycolumns'} = Bugzilla::Extension::Testopia::TestCase::fields;
    }
    my @time = localtime(time());
    my $date = sprintf "%04d-%02d-%02d", 1900+$time[5],$time[4]+1,$time[3];
    my $filename = "testplans-$date.$format->{extension}";
    print $cgi->header(-type => $format->{'ctype'},
                   -content_disposition => "$disp; filename=$filename");

    $vars->{'json'} = $table->to_ext_json;
    $vars->{'table'} = $table;
    $template->process($format->{'template'}, $vars)
        || ThrowTemplateError($template->error());
}
