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

package Bugzilla::Extension::Testopia::WebService::Build;

use strict;

use base qw(Bugzilla::WebService);
use lib qw(./extensions/Testopia/lib);

use Bugzilla::Error;
use Bugzilla::Constants;

use Bugzilla::Extension::Testopia::Build;
use Bugzilla::Extension::Testopia::Product;

sub get {
    my $self = shift;
    my ($params) = @_;
    
    if (!ref $params){
        $params = {};
        $params->{id} =  $_[0];
    }
    
    Bugzilla->login(LOGIN_REQUIRED);
    
    # Result is a build object hash
    my $build = new Bugzilla::Extension::Testopia::Build($params);

    ThrowUserError('invalid-test-id-non-existent', {type => 'Build', id => $params->{id}}) unless $build->{build_id};
    ThrowUserError('testopia-read-only', {'object' => $build->product}) unless $build->product->canedit;
        
    $build->run_count();

    return $build;
}

sub check_build {
    my $self = shift;
    
    my ($params) = @_;
    
    if (!ref $params){
        $params = {};
        $params->{name} = shift;
        $params->{product} = shift;
    }
    
    Bugzilla->login(LOGIN_REQUIRED);
    
    my $product;
    if ($params->{product} =~ /^\d+$/){
        $product = Bugzilla::Extension::Testopia::Product->new($params->{product});
    }
    else {
        $product = Bugzilla::Product::check_product($params->{product});
        $product = Bugzilla::Extension::Testopia::Product->new($product->id);
    }
    
    ThrowUserError('testopia-read-only', {'object' => $product}) unless $product->canedit;
    
    return Bugzilla::Extension::Testopia::Build::check_build($params->{name}, $product, "THROWERROR");
}

sub create{
    my $self = shift;
    my ($new_values) = @_;  # Required: name, product_id

    Bugzilla->login(LOGIN_REQUIRED);
    
    $new_values->{'product_id'} ||= $new_values->{'product'};
    delete $new_values->{'product'};
    
    my $product;
    if ($new_values->{'product_id'} =~ /^\d+$/){
        $product = Bugzilla::Extension::Testopia::Product->new($new_values->{'product_id'});
    }
    else {
        $product = Bugzilla::Product::check_product($new_values->{'product_id'});
        $product = Bugzilla::Extension::Testopia::Product->new($product->id);
    }
    
    ThrowUserError('testopia-read-only', {'object' => $product}) unless $product->canedit;
  
    $new_values->{'milestone'} ||= $product->default_milestone;
    if (! defined $new_values->{'isactive'}){
         $new_values->{'isactive'} = 1;
    }
    
    my $build = Bugzilla::Extension::Testopia::Build->create($new_values);
    
    # Result is new build
    return $build;
}

sub update{
    my $self = shift;
    my ($new_values) = @_;
    
    if(!ref $new_values){
        $new_values = $_[1];
        $new_values->{id} = $_[0];
    }
    
    Bugzilla->login(LOGIN_REQUIRED);
    
    my $build = new Bugzilla::Extension::Testopia::Build($new_values->{id});
    ThrowUserError("invalid-test-id-non-existent", {'id' => $new_values->{id}, 'type' => 'Build'}) unless $build->{build_id};
    ThrowUserError('testopia-read-only', {'object' => $build->product}) unless $build->product->canedit;

    $build->set_name($new_values->{'name'}) if $new_values->{'name'};
    $build->set_description($new_values->{'description'}) if defined $new_values->{'description'};
    $build->set_milestone($new_values->{'milestone'}) if $new_values->{'milestone'};
    $build->set_isactive($new_values->{'isactive'} =~ /(true|1|yes)/i ? 1 : 0) if defined $new_values->{'isactive'};
    
    $build->update;

    return $build;
}

# DEPRECATED use Build::get instead
sub lookup_name_by_id {
  my $self = shift;
  my ($params) = @_;
  
    if (!ref $params){
        $params = {};
        $params->{id} =  $_[0];
    }

  Bugzilla->login(LOGIN_REQUIRED);
  
  die "Invalid Build ID" 
      unless defined $params->{id} && length($params->{id}) > 0 && $params->{id} > 0;
      
  my $build = new Bugzilla::Extension::Testopia::Build($params->{id});
  ThrowUserError('testopia-read-only', {'object' => $build->product}) unless $build->product->canedit;
  
  my $result = defined $build ? $build->name : '';
  
  # Result is build name string or empty string if ERROR
  return $result;
}

sub get_runs {
    my $self = shift;
    my ($params) = @_;
    
    if (!ref $params){
        $params = {};
        $params->{id} =  $_[0];
    }

    Bugzilla->login(LOGIN_REQUIRED);    

    my $build = new Bugzilla::Extension::Testopia::Build($params);

    ThrowUserError('invalid-test-id-non-existent', {type => 'Build', id => $params->{id}}) unless $build->{build_id};
    ThrowUserError('testopia-read-only', {'object' => $build}) unless $build->product->canview;
    
    # Result is list of test runs for the given build
    return $build->runs();
}

sub get_caseruns {
    my $self = shift;
    my ($params) = @_;

    if (!ref $params){
        $params = {};
        $params->{id} =  $_[0];
    }

    Bugzilla->login(LOGIN_REQUIRED);    

    my $build = new Bugzilla::Extension::Testopia::Build($params);

    ThrowUserError('invalid-test-id-non-existent', {type => 'Build', id => $params->{id}}) unless $build->{build_id};
    ThrowUserError('testopia-read-only', {'object' => $build}) unless $build->product->canview;
    
    # Result is list of test runs for the given build
    return $build->caseruns();
}

1;

__END__

=head1 NAME

Testopia::Webservice::Build

=head1 EXTENDS

Bugzilla::Webservice

=head1 DESCRIPTION

Provides methods for automated scripts to manipulate Testopia Builds. 
It is important that you read the documentation for L<Bugzilla::WebService> 
as this documentation assumes you are familiar with XMLRPC from Bugzilla.

NOTE: In most cases where and id is required, a name attribute can be used instead
provided it is unique. For example, Build.get({id => integer}) can substitute 
Build.get({name => string})

=head1 METHODS

=over

=item C<check_build>

 Description: Looks up and returns a build by name.

 Params:      $name - String: name of the build.
              $product - Integer/String
                         Integer: product_id of the product in the Database
                         String: Product name

 Returns:     Hash: Matching Build object hash or error if not found.

=item C<create>

 Description: Creates a new build object and stores it in the database

 Params:      $values - Hash: A reference to a hash with keys and values  
              matching the fields of the build to be created. 
  +-------------+----------------+-----------+------------------------------------+
  | Field       | Type           | Null      | Description                        |
  +-------------+----------------+-----------+------------------------------------+
  | product     | Integer/String | Required  | ID or Name of product              |
  | name        | String         | Required  |                                    |
  | milestone   | String         | Optional  | Defaults to product's default MS   |
  | description | String         | Optional  |                                    |
  | isactive    | Boolean        | Optional  | Defaults to True (1)               |
  +-------------+----------------+-----------+------------------------------------+

 Returns:     The newly created object hash.

=item C<get>

 Description: Used to load an existing build from the database.

 Params:      $id - An integer representing the ID in the database

 Returns:     A blessed Bugzilla::Extension::Testopia::Build object hash

=item C<get_caseruns>

 Description: Returns the list of case-runs that this Build is used in.

 Params:      $id -  Integer: Build ID.

 Returns:     Array: List of case-run object hashes.

=item C<get_runs>

 Description: Returns the list of runs that this Build is used in.

 Params:      $id -  Integer: Build ID.

 Returns:     Array: List of run object hashes.

=item C<update>

 Description: Updates the fields of the selected build or builds.

 Params:      $values - Hash of keys matching Build fields and the new values 
              to set each field to.

              The id field is used to lookup the build and is read only.
                        +--------------+----------------+
                        | Field        | Type           |
                        +--------------+----------------+
                        | id (readonly)| Integer        |
                        | name         | String         |
                        | milestone    | String         |
                        | description  | String         |
                        | isactive     | Boolean        |
                        +--------------+----------------+

 Returns:     Hash: The updated Build object hash.

=back

=head1 SEE ALSO

=over

=item L<Bugzilla::Extension::Testopia::Build>

=item L<Bugzilla::Webservice> 

=back

=head1 AUTHOR

Greg Hendricks <ghendricks@novell.com>