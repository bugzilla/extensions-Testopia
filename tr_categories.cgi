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
use lib qw(. lib);

use Bugzilla;
use Bugzilla::Util;
use Bugzilla::Constants;
use Bugzilla::Error;

BEGIN { Bugzilla->extensions }

use Bugzilla::Extension::Testopia::Category;
use Bugzilla::Extension::Testopia::Util;
use Bugzilla::Extension::Testopia::Constants;
use JSON;

Bugzilla->error_mode(ERROR_MODE_AJAX);
Bugzilla->login(LOGIN_REQUIRED);

my $cgi = Bugzilla->cgi;

my $action =  $cgi->param('action') || '';
my $product_id = $cgi->param('product_id');

print "Location: tr_show_product.cgi?tab=category\n\n" unless $action;

print $cgi->header;

ThrowUserError("testopia-missing-parameter", {param => "product_id"}) unless $product_id;

my $product = Bugzilla::Extension::Testopia::Product->new($product_id);

#########################
### Create a Category ###
#########################

if ($action eq 'add'){
    ThrowUserError('testopia-read-only', {'object' => $product}) unless $product->canedit;
    my $category = Bugzilla::Extension::Testopia::Category->create({
                          product_id  => $product->id,
                          name        => $cgi->param('name'),
                          description => $cgi->param('description'),
                   });

    print "{success: true, category_id: ". $category->id . "}";
}

#######################
### Edit a Category ###
#######################
elsif ($action eq 'edit'){
    ThrowUserError('testopia-read-only', {'object' => $product}) unless $product->canedit;
    my $category = Bugzilla::Extension::Testopia::Category->new($cgi->param('category_id'));
    
    $category->set_name($cgi->param('name')) if $cgi->param('name');
    $category->set_description($cgi->param('description')) if $cgi->param('description');

    $category->update;
    print "{success: true}";
}

#########################
### Delete a Category ###
#########################
elsif ($action eq 'delete'){
    ThrowUserError('testopia-read-only', {'object' => $product}) unless $product->canedit;
    my $category = Bugzilla::Extension::Testopia::Category->new($cgi->param('category_id'));
    ThrowUserError("testopia-non-zero-case-count") unless $category->candelete;
    
    $category->remove;

    print "{success: true}";

}

elsif ($action eq 'list'){
    ThrowUserError('testopia-permission-denied', {'object' => $product}) unless $product->canview;
    my $json = new JSON;
    
    my $out;
    $out .= $_->TO_JSON . ',' foreach (@{$product->categories()});
    chop ($out); # remove the trailing comma for IE
    
    print "{categories:[$out]}";
    
}
