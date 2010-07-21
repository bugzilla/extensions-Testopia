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

package Bugzilla::Extension::Testopia::WebService::Environment;

use strict;

use base qw(Bugzilla::WebService);
use lib qw(./extensions/Testopia/lib);

use Bugzilla::Constants;
use Bugzilla::Error;

use Bugzilla::Extension::Testopia::Environment;
use Bugzilla::Extension::Testopia::Product;
use Bugzilla::Extension::Testopia::Search;
use Bugzilla::Extension::Testopia::Table;

sub get {
    my $self = shift;
    my ($params) = @_;

    if (!ref $params){
        $params = {};
        $params->{id} =  $_[0];
    }

    Bugzilla->login(LOGIN_REQUIRED);    

    my $environment = new Bugzilla::Extension::Testopia::Environment($params);

    ThrowUserError('invalid-test-id-non-existent', {type => 'Environment', id => $params}) unless $environment->{environment_id};
    ThrowUserError('testopia-read-only', {'object' => $environment}) unless $environment->canview;
    
    #Result is a environment hash map   
    return $environment;
}

sub check_environment {
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
    
    return Bugzilla::Extension::Testopia::Environment::check_environment($params->{name}, $product, 'THROWERROR');
}

sub list {
    my $self = shift;
    my ($query) = @_;

    Bugzilla->login(LOGIN_REQUIRED);

    my $cgi = Bugzilla->cgi;
    $cgi->param("current_tab", "environment");
    foreach (keys(%$query)){
        $cgi->param($_, $query->{$_});
    }
        
    my $search = Bugzilla::Extension::Testopia::Search->new($cgi);

    # Result is an array of environment hash maps 
    return Bugzilla::Extension::Testopia::Table->new('environment', 'xmlrpc.cgi',$cgi,undef, $search->query())->list();
    
}

sub create {
    my $self = shift;
    my ($new_values) = @_;

    Bugzilla->login(LOGIN_REQUIRED);
    
    # Setup field name aliasing
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
    
    if (! defined $new_values->{'isactive'}){
         $new_values->{'isactive'} = 1;
    }
    
    my $environment = Bugzilla::Extension::Testopia::Environment->create($new_values);
    
    # Result is new environment
    return $environment;
}

sub create_full {
    my $self = shift;
    
    my ($params) = @_;

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

    my $env_id = Bugzilla::Extension::Testopia::Environment->create_full($params->{name}, $product->id, $params->{environment});

    return $env_id;
}    

sub update {
    my $self = shift;
    my ($new_values) = @_;

    if(!ref $new_values){
        $new_values = $_[1];
        $new_values->{id} = $_[0];
    }
    
    Bugzilla->login(LOGIN_REQUIRED);
    my $environment = new Bugzilla::Extension::Testopia::Environment($new_values);
    
    ThrowUserError('invalid-test-id-non-existent', {type => 'Environment', id => $new_values->{id}}) unless $environment->{environment_id};
    ThrowUserError('testopia-read-only', {'object' => $environment}) unless $environment->canedit;
    
    $environment->set_name($new_values->{'name'}) if $new_values->{'name'};
    $environment->set_isactive($new_values->{'isactive'} =~ /(true|1|yes)/i ? 1 : 0) if defined $new_values->{'isactive'};
    
    $environment->update();

    # Result is modified environment, otherwise an exception will be thrown
    return $environment;
}

sub get_runs {
    my $self = shift;
    my ($params) = @_;

    if (!ref $params){
        $params = {};
        $params->{id} =  $_[0];
    }

    Bugzilla->login(LOGIN_REQUIRED);    

    my $environment = new Bugzilla::Extension::Testopia::Environment($params);

    ThrowUserError('invalid-test-id-non-existent', {type => 'Environment', id => $params->{id}}) unless $environment->{environment_id};
    ThrowUserError('testopia-read-only', {'object' => $environment}) unless $environment->canview;
    
    # Result is list of test runs for the given environment
    return $environment->runs();
}

sub get_caseruns {
    my $self = shift;
    my ($params) = @_;

    if (!ref $params){
        $params = {};
        $params->{id} =  $_[0];
    }

    Bugzilla->login(LOGIN_REQUIRED);    

    my $environment = new Bugzilla::Extension::Testopia::Environment($params);

    ThrowUserError('invalid-test-id-non-existent', {type => 'Environment', id => $params->{id}}) unless $environment->{environment_id};
    ThrowUserError('testopia-read-only', {'object' => $environment}) unless $environment->canview;
    
    # Result is list of test runs for the given environment
    return $environment->caseruns();
}

1;
__END__

=head1 NAME

Testopia::Webservice::Environment

=head1 EXTENDS

Bugzilla::Webservice

=head1 DESCRIPTION

Provides methods for automated scripts to manipulate Testopia Environments

=head1 METHODS

=over

=item C<check_environment>

 Description: Looks up and returns an environment by name.

 Params:      $name - String: name of the environment.
              $product - Integer/String
                         Integer: product_id of the product in the Database
                         String: Product name

 Returns:     Hash: Matching Environment object hash or error if not found.

=item C<create>

 Description: Creates a new environment object and stores it in the database

 Params:      $values - Hash: A reference to a hash with keys and values  
              matching the fields of the environment to be created. 
  +-------------+----------------+-----------+------------------------------------+
  | Field       | Type           | Null      | Description                        |
  +-------------+----------------+-----------+------------------------------------+
  | product_id  | Integer/String | Required  | ID or Name of product              |
  | name        | String         | Required  |                                    |
  | isactive    | Boolean        | Optional  | Defaults to True (1)               |
  +-------------+----------------+-----------+------------------------------------+

 Returns:     The newly created object hash.

=item C<create_full>

 Description: When an environment starting with $basename does not exist yet 
 exactly matching $envhash, creates a new environment object, and any new
 elements, properties, values, and the mapping between them and stores it in
 the database. The full environment name that is created will be a conjunction
 of the $basename and a date and time stamp. Else returns id of existing env. 

 Params: $basename -  String:   starting name of the environment (remainder
                        will be a date time conjunction added by this function)
           $product -  Integer/String:  product name or id of the product in the Database
           $envhash -  Hash ref: Multilevel hash following a format: Top level hash 
                         keys are assumed to be categories. Bottom level
                         values (leaves) and their immediate keys are assumed
                         to be the values and properties in the database, 
                         respectively. Between the top level and bottom level
                         keys are the elements. Everything will be created
                         if it does not yet exist in the database except for
                         the categories which must exist beforehand. 

Here is an example of an $envhash (quotes removed):

{                          

Hardware => {

          System Board => {
                              Type => i386,
                              Manufacturer => Ssystem manufacturer,
                              Model => System product name
                          },

          Memory => {
                        Total Physical => 2,015.33 MB
                    }

            },

Software => {

          BIOS => {
                      Version/Date => American Megatrends Inc. 1.00, 11/25/2003
                  },

          Operating System => {

                                  Version => 5.2.3790 Service Pack 2 Build 3790,
                                  Manufacturer => Microsoft Corporation,
                                  Name => Microsoft(R) Windows(R) Server 2003, Standard Edition
                              }

            },

Harddrives => {

          1 => {
                   Card => 0,
                   Firmware Revision => 34.06J34,
                   Channel => 6,
                   Model => WDC WD360GD-00FNA0
               },

          0 => {
                   Card => 0,
                   Firmware Revision => 35.06K35,
                   Channel => 7,
                   Model => WDC WD360GD-00FNA0
               },

          2 => {
                   Card => 0,
                   Firmware Revision => 27.08D27,
                   Channel => 5,
                   Model => WDC WD740GD-00FLA1
               },

              },

};


 Returns:     The environment id of the newly created or matching environment.

=item C<get>

 Description: Used to load an existing Environment from the database.

 Params:      $id - An integer representing the ID in the database

 Returns:     A blessed Bugzilla::Extension::Testopia::Environment object hash

=item C<get_caseruns>

 Description: Returns the list of case-runs that this Environment is used in.

 Params:      $id -  Integer: Environment ID.

 Returns:     Array: List of case-run object hashes.

=item C<get_runs>

 Description: Returns the list of runs that this Environment is used in.

 Params:      $id -  Integer: Environment ID.

 Returns:     Array: List of run object hashes.

=item C<list>

 Description: Performs a search and returns the resulting list of Environments

 Params:      $query - Hash: keys must match valid search fields.

                        +--------------------------+
                        | classification           |
                        | env_products             |
                        | env_categories           |
                        | env_elements             |
                        | env_properties           |
                        | env_expressions          |
                        | name                     |
                        | env_value_selected_type  |
                        +--------------------------+

 Returns:     Array: Matching Environments are retuned in a list of hashes.

=item C<update>

 Description: Updates the fields of the selected environment or environments.

 Params:      $values - Hash of keys matching Environment fields and the new values 
              to set each field to.
              
              The id field is used to lookup the environment and is read only.
                      +--------------+----------------+
                      | Field        | Type           |
                      +--------------+----------------+
                      | id (readonly)| String         |
                      | name         | String         |
                      | isactive     | Boolean        |
                      +--------------+----------------+

 Returns:     Hash: The updated environment object hash.

=back

=head1 SEE ALSO

L<Bugzilla::Extension::Testopia::Environment>
L<Bugzilla::Webservice> 

=head1 AUTHOR

Greg Hendricks <ghendricks@novell.com>
