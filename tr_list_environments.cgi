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

use strict;
use lib qw(. lib extensions/testopia/lib);

use Bugzilla;
use Bugzilla::Config;
use Bugzilla::Constants;
use Bugzilla::Error;
use Testopia::Search;
use Testopia::Table;
use Testopia::Util;
use Testopia::TestRun;
use Testopia::Environment;
use Testopia::Environment::Element;
use Testopia::Environment::Category;
use Testopia::Environment::Property;
use Testopia::Constants;

Bugzilla->login(LOGIN_REQUIRED);


my $vars = {};
my $template = Bugzilla->template;
my $cgi = Bugzilla->cgi;
Bugzilla->error_mode(ERROR_MODE_AJAX) if ($cgi->param('ctype') eq 'json');

my $format = $template->get_format("testopia/case/list", scalar $cgi->param('format'), scalar $cgi->param('ctype'));
my $action = $cgi->param('action') || '';

$vars->{'qname'} = $cgi->param('qname') if $cgi->param('qname');

$cgi->param('current_tab', 'environment');
$cgi->param('distinct', '1');

# We have to do this until we have product level permission checks in place
my $product_id = $cgi->param('product_id');
unless ($product_id){
    print $cgi->header;
    ThrowUserError("testopia-missing-parameter", {param => "product_id"});
}

my $product = Testopia::Product->new($product_id);
unless ($product && $product->canview){
    print $cgi->header;
    ThrowUserError('testopia-read-only', {'object' => $product});
}

my $search = Testopia::Search->new($cgi);
my $table = Testopia::Table->new('environment', 'tr_list_environments.cgi', $cgi, undef, $search->query);

if ($cgi->param('ctype') eq 'json'){
    print $cgi->header;
    $vars->{'json'} = $table->to_ext_json;
    $template->process($format->{'template'}, $vars)
        || ThrowTemplateError($template->error());
}
else{
    print "Location: tr_show_product.cgi?tab=environments\n\n";
}
