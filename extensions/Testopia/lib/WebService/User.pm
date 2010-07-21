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
# The Original Code is the Bugzilla Bug Tracking System.
#
# Contributor(s): Marc Schumann <wurblzap@gmail.com>
#                 Max Kanat-Alexander <mkanat@bugzilla.org>
#                 Mads Bondo Dydensborg <mbd@dbc.dk>
#                 Noura Elhawary <nelhawar@redhat.com>

package Bugzilla::Extension::Testopia::WebService::User;

use strict;
use base qw(Bugzilla::WebService);
use lib qw(./extensions/Testopia/lib);

use Bugzilla;
use Bugzilla::Constants;
use Bugzilla::Error;
use Bugzilla::User;

#################
# User Lookup   #
#################

sub lookup_login_by_id {
    my $self = shift;
    my ($params) = @_;

    if ( !ref $params ) {
        $params = {};
        $params->{id} = $_[0];
    }

    my $user = new Bugzilla::User( $params->{id} );

    my $result = defined $user ? $user->login : '';

    # Result is user login string or empty string if failed
    return $result;
}

sub lookup_id_by_login {
    my $self = shift;
    my ($params) = @_;

    if ( !ref $params ) {
        $params = {};
        $params->{login} = $_[0];
    }
    
    my $result = Bugzilla::User::login_to_id( $params->{login} );

    # Result is user id or 0 if failed
    return $result;
}

1;

__END__

=head1 NAME

Bugzilla::Testopia::Webservice::User - Lookup users by Id or Name

=head1 DESCRIPTION

Allows you to lookup users by login name (email) or ID

=head1 METHODS

See L<Bugzilla::WebService> for a description of how parameters are passed.

=over

=item lookup_status_name_by_id 

 Params:      $id - Integer: ID of the status to return

 Returns:     String: the status name.

=item lookup_status_id_by_name

 Params:      $login - String: the status name. 

 Returns:     Integer: ID of the status.

=back

=head1 SEE ALSO

L<Bugzilla::Extension::Testopia::TestCaseRun>
L<Bugzilla::Webservice> 

=head1 AUTHOR

Greg Hendricks <ghendricks@novell.com>
