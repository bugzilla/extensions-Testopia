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
# Contributor(s): Dallas Harken <dharken@novell.com>
#                 Greg Hendricks <ghendricks@novell.com>

package Bugzilla::Extension::Testopia::WebService::Product;

use strict;

use base qw(Bugzilla::WebService);
use lib qw(./extensions/Testopia/lib);

use Bugzilla::Error;
use Bugzilla::Constants;

use Bugzilla::Extension::Testopia::Product;

sub _validate {
    my ($params) = @_;
    
    Bugzilla->login(LOGIN_REQUIRED);
    
    my $product = Bugzilla::Extension::Testopia::Product->new($params);
    
    ThrowUserError('invalid-test-id-non-existent', {type => 'Product', id => $params}) unless $product;
    ThrowUserError('testopia-permission-denied', {'object' => $product}) if $product && !$product->canedit;

    return $product;
}

sub get {
    my $self = shift;
    my ($id) = @_;
    
    Bugzilla->login(LOGIN_REQUIRED);
    
    # Result is a product object hash
    my $product = new Bugzilla::Extension::Testopia::Product($id);

    ThrowUserError('invalid-test-id-non-existent', {type => 'Product', id => $id}) unless $product;
    ThrowUserError('testopia-permission-denied', {'object' => $product}) unless $product->canedit;

    return $product;
}

sub check_product {
    my $self = shift;
    my ($name) = @_;
 
    my $product = _validate($name);
    
    return $product;
}

sub check_category {
    my $self = shift;
    my ($params) = @_;
    
    if (!ref $params){
        $params = {};
        $params->{name} = shift;
        $params->{product} = shift;
    }
    
    Bugzilla->login(LOGIN_REQUIRED);
    
    my $product = _validate($params->{product});
    
    ThrowUserError('testopia-read-only', {'object' => $product}) unless $product->canedit;
    require Bugzilla::Extension::Testopia::Category;
    return Bugzilla::Extension::Testopia::Category->new(Bugzilla::Extension::Testopia::Category::check_case_category($params));
}

sub check_component {
    my $self = shift;
    my ($params) = @_;
    
    if (!ref $params){
        $params = {};
        $params->{name} = shift;
        $params->{product} = shift;
    }
    
    Bugzilla->login(LOGIN_REQUIRED);
    
    my $product = _validate($params->{product});
    
    ThrowUserError('testopia-read-only', {'object' => $params->{product}}) unless $product->canedit;
    require Bugzilla::Component;
    return Bugzilla::Component->check($params);
}

sub get_builds {
    my $self = shift;
    my ($params) = @_;
    
    if (!ref $params){
        $params = {};
        $_[0] =~ /^\d+$/ ? $params->{id} = $_[0] : $params->{name} = $_[0]; 
        $params->{active} = $_[1];
    }
    
    my $product = _validate($params);
    
    return $product->builds($params->{active});
    
}

sub get_category {
    my $self = shift;
    my ($id) = @_;
    
    Bugzilla->login(LOGIN_REQUIRED);
    
    require Bugzilla::Extension::Testopia::Category;
    
    my $category = Bugzilla::Extension::Testopia::Category->new($id); 
    
    ThrowUserError('invalid-test-id-non-existent', {type => 'Category', id => $id}) unless $category;
    ThrowUserError('testopia-permission-denied', {'object' => $category->product}) unless $category->product->canedit;
    
    delete $category->{'product'};
    
    return  $category;
}

sub get_component {
    my $self = shift;
    my ($params) = @_;
    
    if (!ref $params){
        $params = {};
        $_[0] =~ /^\d+$/ ? $params->{id} = $_[0] : $params->{name} = $_[0]; 
        $params->{product} = $_[1];
    }
    
    Bugzilla->login(LOGIN_REQUIRED);
    
    require Bugzilla::Component;
    
    my $component;
    if ($params->{product}){
        $params->{product} = Bugzilla::Product->new({name => $params->{product}});
        $component = Bugzilla::Component->new($params);
    }
    else {
        $component = Bugzilla::Component->new($params->{id});
    }
    
    ThrowUserError('invalid-test-id-non-existent', {type => 'Component', id => $params}) unless $component;
    
    my $product = Bugzilla::Extension::Testopia::Product->new($component->product_id);
    
    ThrowUserError('testopia-permission-denied', {'object' => $product}) unless $product->canedit;
    
    return  $component;
}

sub get_cases {
    my $self = shift;
    my ($product) = @_;
    
    $product = _validate($product);
    
    return $product->cases;
}

sub get_categories {
    my $self = shift;
    my ($product) = @_;
    
    $product = _validate($product);
    
    return $product->categories;
}

sub get_components {
    my $self = shift;
    my ($product) = @_;
    
    $product = _validate($product);
    
    return $product->components;
}

sub get_environments {
    my $self = shift;
    my ($product) = @_;
    
    $product = _validate($product);
    
    return $product->environments;
}

sub get_milestones {
    my $self = shift;
    my ($product) = @_;
    
    $product = _validate($product);
    
    return $product->milestones;
}

sub get_plans {
    my $self = shift;
    my ($product) = @_;
    
    $product = _validate($product);
    
    return $product->plans;
}

sub get_runs {
    my $self = shift;
    my ($product) = @_;
    
    $product = _validate($product);
    
    return $product->runs;
}

sub get_tags {
    my $self = shift;
    my ($product) = @_;
    
    $product = _validate($product);
    
    return $product->tags;
}

sub get_versions {
    my $self = shift;
    my ($product) = @_;
    
    $product = _validate($product);
    
    return $product->versions;

}

1;

__END__

=head1 NAME

Testopia::Webservice::Product

=head1 EXTENDS

Bugzilla::Webservice

=head1 DESCRIPTION

Provides methods for automated scripts to expose Testopia Product data.

NOTE: In most cases where and id is required, a name attribute can be used instead
provided it is unique. For example, Build.get({id => integer}) can substitute 
Build.get({name => string})


=head1 METHODS

=over

=item C<check_category>

 Description: Looks up and returns a category by name.

 Params:      $name - String: name of the category.
              $product - Integer/String
                 Integer: product_id of the product in the Database
                 String: Product name

 Returns:     Hash: Matching Category object hash or error if not found.

=item C<check_component>

 Description: Looks up and returns a component by name.

 Params:      $name - String: name of the category.
              $product - Integer/String
                 Integer: product_id of the product in the Database
                 String: Product name

 Returns:     Hash: Matching component object hash or error if not found.

=item C<check_product>

 Description: Looks up and returns a validated product.

 Params:      $name - String: name of the product.

 Returns:     Hash: Matching Product object hash or error if not found.

=item C<get>

 Description: Used to load an existing product from the database.

 Params:      $id - An integer representing the ID in the database

 Returns:     A blessed Bugzilla::Extension::Testopia::Product object hash

=item C<get_builds>

 Description: Get the list of builds associated with this product.

 Params:      $product - Integer/String
                         Integer: product_id of the product in the Database
                         String: Product name
              $active  - Boolean: True to only include builds where isactive is true. 

 Returns:     Array: Returns an array of Build objects.

=item C<get_cases>

 Description: Get the list of cases associated with this product.

 Params:      $product - Integer/String
                         Integer: product_id of the product in the Database
                         String: Product name

 Returns:     Array: Returns an array of TestCase objects.

=item C<get_categories>

 Description: Get the list of categories associated with this product.

 Params:      $product - Integer/String
                         Integer: product_id of the product in the Database
                         String: Product name

 Returns:     Array: Returns an array of Case Category objects.

=item C<get_category>

 Description: Get the category matching the given id.

 Params:      $id - Integer: ID of the category in the database.

 Returns:     Hash: Category object hash.

=item C<get_component>

 Description: Get the component matching the given id.

 Params:      $id - Integer: ID of the component in the database.

 Returns:     Hash: Component object hash.

=item C<get_components>

 Description: Get the list of components associated with this product.

 Params:      $product - Integer/String
                         Integer: product_id of the product in the Database
                         String: Product name

 Returns:     Array: Returns an array of Component objects.

=item C<get_environments>

 Description: Get the list of environments associated with this product.

 Params:      $product - Integer/String
                         Integer: product_id of the product in the Database
                         String: Product name

 Returns:     Array: Returns an array of Environment objects.

=item C<get_milestones>

 Description: Get the list of milestones associated with this product.

 Params:      $product - Integer/String
                         Integer: product_id of the product in the Database
                         String: Product name

 Returns:     Array: Returns an array of Milestone objects.

=item C<get_plans>

 Description: Get the list of plans associated with this product.

 Params:      $product - Integer/String
                         Integer: product_id of the product in the Database
                         String: Product name

 Returns:     Array: Returns an array of Test Plan objects.

=item C<get_runs>

 Description: Get the list of runs associated with this product.

 Params:      $product - Integer/String
                         Integer: product_id of the product in the Database
                         String: Product name

 Returns:     Array: Returns an array of Test Run objects.

=item C<get_tags>

 Description: Get the list of tags associated with this product.

 Params:      $product - Integer/String
                         Integer: product_id of the product in the Database
                         String: Product name

 Returns:     Array: Returns an array of Tags objects.

=item C<get_versions>

 Description: Get the list of versions associated with this product.

 Params:      $product - Integer/String
                         Integer: product_id of the product in the Database
                         String: Product name

 Returns:     Array: Returns an array of Version objects.

=back

=head1 SEE ALSO

L<Bugzilla::Extension::Testopia::Product>
L<Bugzilla::Webservice> 

=head1 AUTHOR

Greg Hendricks <ghendricks@novell.com>