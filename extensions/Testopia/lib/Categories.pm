# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# This Source Code Form is "Incompatible With Secondary Licenses", as
# defined by the Mozilla Public License, v. 2.0.

package Bugzilla::Extension::Testopia::Categories;

use strict;
use warnings;

use Bugzilla::Util;
use Bugzilla::Constants;
use Bugzilla::Error;

use Bugzilla::Extension::Testopia::Category;
use Bugzilla::Extension::Testopia::Util;
use Bugzilla::Extension::Testopia::Constants;
use Bugzilla::Extension::Testopia::Product;

sub report {
    my $input = Bugzilla->input_params;
    my $cgi = Bugzilla->cgi;

    Bugzilla->error_mode(ERROR_MODE_AJAX);
    Bugzilla->login(LOGIN_REQUIRED);

    my $action =  $input->{'action'} || '';
    my $product_id = $input->{'product_id'};

    print $cgi->redirect('page.cgi?id=tr_show_product.html&tab=category') unless $action;

    print $cgi->header;

    ThrowUserError("testopia-missing-parameter", {param => "product_id"}) unless $product_id;

    my $product = Bugzilla::Extension::Testopia::Product->new($product_id);

    #########################
    ### Create a Category ###
    #########################
    if ($action eq 'add') {
        ThrowUserError('testopia-read-only', {'object' => $product}) unless $product->canedit;
        my $category = Bugzilla::Extension::Testopia::Category->create({
            product_id  => $product->id,
            name        => $input->{'name'},
            description => $input->{'description'},
        });

        print "{success: true, category_id: ". $category->id . "}";
    }

    #######################
    ### Edit a Category ###
    #######################
    elsif ($action eq 'edit') {
        ThrowUserError('testopia-read-only', {'object' => $product}) unless $product->canedit;
        my $category = Bugzilla::Extension::Testopia::Category->new($input->{'category_id'});

        $category->set_name($input->{'name'}) if $input->{'name'};
        $category->set_description($input->{'description'}) if $input->{'description'};

        $category->update;
        print "{success: true}";
    }

    #########################
    ### Delete a Category ###
    #########################
    elsif ($action eq 'delete') {
        ThrowUserError('testopia-read-only', {'object' => $product}) unless $product->canedit;
        my $category = Bugzilla::Extension::Testopia::Category->new($input->{'category_id'});
        ThrowUserError("testopia-non-zero-case-count") unless $category->candelete;

        $category->remove;

        print "{success: true}";
    }

    elsif ($action eq 'list') {
        ThrowUserError('testopia-permission-denied', {'object' => $product}) unless $product->canview;

        my $out;
        $out .= $_->TO_JSON . ',' foreach (@{$product->categories()});
        chop ($out); # remove the trailing comma for IE

        print "{categories:[$out]}";
    }
}

1;
