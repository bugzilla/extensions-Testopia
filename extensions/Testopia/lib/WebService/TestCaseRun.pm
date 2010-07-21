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

package Bugzilla::Extension::Testopia::WebService::TestCaseRun;

use strict;

use base qw(Bugzilla::WebService);
use lib qw(./extensions/Testopia/lib);

use Bugzilla::User;
use Bugzilla::Constants;
use Bugzilla::Error;
use Bugzilla::Util;

use Bugzilla::Extension::Testopia::Constants;
use Bugzilla::Extension::Testopia::Search;
use Bugzilla::Extension::Testopia::Table;
use Bugzilla::Extension::Testopia::TestCaseRun;
use Bugzilla::Extension::Testopia::Util;

sub get {
    my $self = shift;
    my ($params) = @_;

    if (ref $params ne 'HASH'){
        $params = {};
        $params->{run_id} = shift;
        $params->{case_id} = shift;
        $params->{build_id} = shift;
        $params->{env_id} = shift;
    } 

    Bugzilla->login(LOGIN_REQUIRED);
    
    if ($params->{build_id} && $params->{build_id} !~ /^\d+$/){ 
        my $run = Bugzilla::Extension::Testopia::TestRun->new($params->{run_id});
        ThrowUserError('invalid-test-id-non-existent') unless $run;
        my $build = Bugzilla::Extension::Testopia::Build::check_build($params->{build_id}, $run->product, "THROW");
        $params->{build_id} = $build->id;
    }
    if ($params->{env_id} && $params->{env_id} !~ /^\d+$/){ 
        my $run = Bugzilla::Extension::Testopia::TestRun->new($params->{run_id});
        ThrowUserError('invalid-test-id-non-existent') unless $run;
        my $environment = Bugzilla::Extension::Testopia::Build::check_environment($params->{env_id}, $run->product, "THROW");
        $params->{env_id} = $environment->id;
    }

    my $caserun;
    if ($params->{id}){
        $caserun = new Bugzilla::Extension::Testopia::TestCaseRun($params->{id});
    }
    else {
        $caserun = new Bugzilla::Extension::Testopia::TestCaseRun($params->{run_id}, $params->{case_id}, $params->{build_id}, $params->{env_id});
    }

    ThrowUserError('invalid-test-id-non-existent', {type => 'Test Case Run', id => $params->{run_id}}) unless $caserun->{case_run_id};
    ThrowUserError('testopia-permission-denied', {'object' => $caserun}) unless $caserun->canview;

    return $caserun;
}

sub list {
    my $self = shift;
    my ($query) = @_;

    Bugzilla->login(LOGIN_REQUIRED);
    
    my $cgi = Bugzilla->cgi;
    
    $cgi->param("current_tab", "case_run");
    
    foreach (keys(%$query)){
        $cgi->param($_, $$query{$_});
    }
    $cgi->param('distinct', 1);
        
    my $search = Bugzilla::Extension::Testopia::Search->new($cgi);

    return Bugzilla::Extension::Testopia::Table->new('case_run','tr_xmlrpc.cgi',$cgi,undef,$search->query())->list();
}

sub list_count {
    my $self = shift;
    my ($query) = @_;

    Bugzilla->login(LOGIN_REQUIRED);
    
    my $cgi = Bugzilla->cgi;
    
    $cgi->param("current_tab", "case_run");
    
    foreach (keys(%$query)){
        $cgi->param($_, $$query{$_});
    }
    $cgi->param('distinct', 1);
    
    my $search = Bugzilla::Extension::Testopia::Search->new($cgi);
    return Bugzilla::Extension::Testopia::Table->new('case_run','tr_xmlrpc.cgi',$cgi,undef,$search->query())->list_count();
}

sub create {
    my $self = shift;
    my ($new_values) = @_;
    
    Bugzilla->login(LOGIN_REQUIRED);
    
    my $run = Bugzilla::Extension::Testopia::TestRun->new($new_values->{'run_id'});
    ThrowUserError('invalid-test-id-non-existent', {type => 'Test Run', id => $new_values->{'run_id'}}) unless $run;
    ThrowUserError('testopia-read-only', {'object' => $run}) unless $run->canedit;
    
    $new_values->{'build_id'} ||= $new_values->{'build'};
    $new_values->{'environment_id'} ||= $new_values->{'environment'};
    $new_values->{'priority_id'} ||= $new_values->{'priority'};
    
    delete $new_values->{'build'};
    delete $new_values->{'environment'};
    delete $new_values->{'priority'};
    
    if (trim($new_values->{'build_id'}) !~ /^\d+$/ ){
        my $build = Bugzilla::Extension::Testopia::Build::check_build($new_values->{'build_id'}, $run->plan->product, "THROWERROR");
        $new_values->{'build_id'} = $build->id;
    }
    if (trim($new_values->{'environment_id'}) !~ /^\d+$/ ){
        my $environment = Bugzilla::Extension::Testopia::Environment::check_environment($new_values->{'environment_id'}, $run->plan->product, "THROWERROR");
        $new_values->{'environment_id'} = $environment->id;
    }
    
    $new_values->{'case_run_status_id'} ||= $new_values->{'status'};
    $new_values->{'case_run_status_id'} ||= IDLE; 
    
    delete $new_values->{'status'};
    
    my $caserun = Bugzilla::Extension::Testopia::TestCaseRun->create($new_values);
    
    # Result is new test case run object hash
    return $caserun;
}

sub update {
    my $self = shift;
    my ($new_values) = @_;

    if (ref $new_values ne 'HASH'){
        $new_values = {};
        if (ref $_[4] eq 'HASH'){
            $new_values = $_[4];
        }
        else {
            $new_values = $_[1]; 
        }  
        
        $new_values->{run_id} = $_[0];
        $new_values->{case_id} =  $_[1];
        $new_values->{build_id} =  $_[2];
        $new_values->{env_id} =  $_[3];
    }

    $new_values->{'case_run_status_id'} ||= $new_values->{'status'};
    $new_values->{'build_id'} ||= $new_values->{'build'};
    $new_values->{'environment_id'} ||= $new_values->{'environment'};
    $new_values->{'priority_id'} ||= $new_values->{'priority'};

    my $run_id = $new_values->{run_id};
    my $case_id = $new_values->{case_id};
    my $build_id = $new_values->{build_id};
    my $env_id = $new_values->{env_id};
    
    Bugzilla->login(LOGIN_REQUIRED);
    
    my @caseruns;
    my @ids;
    if ($new_values->{ids}){
        @ids = Bugzilla::Extension::Testopia::Util::process_list($new_values->{ids});
    }
    else {
        @ids = Bugzilla::Extension::Testopia::Util::process_list($run_id);
    }
    
    if ($new_values->{ids}){
        foreach my $id (@ids){
            my $caserun = new Bugzilla::Extension::Testopia::TestCaseRun($id);
            if ($caserun){
                push @caseruns, $caserun;
            }
            else {
                push @caseruns, {ERROR => 'Case-run does not exist'};
            }
        } 
    }
    elsif ((ref $case_id eq 'HASH' && !$build_id)){
        $new_values = $case_id;
        foreach my $id (@ids){
            my $caserun = new Bugzilla::Extension::Testopia::TestCaseRun($id);
            if ($caserun){
                push @caseruns, $caserun;
            }
            else {
                push @caseruns, {ERROR => 'Case-run does not exist'};
            }
        } 
    }
    else {
        foreach my $id (@ids){
            my $caserun = new Bugzilla::Extension::Testopia::TestCaseRun($run_id,$case_id,$build_id,$env_id);
            if ($caserun->{case_run_id}){
                push @caseruns, $caserun;
            }
            else {
                push @caseruns, {ERROR => 'Case-run does not exist'};
            }
        } 
    }

    my @results;
   
    foreach my $caserun (@caseruns){
        if ($caserun->{'ERROR'}){
            push @results, $caserun;
            next;
        }
        unless ($caserun->canedit){
            push @results, {ERROR => "You do not have rights to edit this test case"};
            next;
        }
        if ($new_values->{'build_id'} && trim($new_values->{'build_id'}) !~ /^\d+$/ ){
            my $build = Bugzilla::Extension::Testopia::Build::check_build($new_values->{'build_id'}, $caserun->run->plan->product);
            if (!$build){
                push @results, {ERROR => "Invalid build for product"};
                next;
            }
            $build = Bugzilla::Extension::Testopia::Build->new($build);
            $new_values->{'build_id'} = $build->id;
        }
        if ($new_values->{'environment_id'} && trim($new_values->{'environment_id'}) !~ /^\d+$/ ){
            my $environment = Bugzilla::Extension::Testopia::Environment::check_environment($new_values->{'environment_id'}, $caserun->run->plan->product);
            if (!$environment){
                push @results, {ERROR => "Invalid environment for product"};
                next;
            }
            $environment = Bugzilla::Extension::Testopia::Environment->new($environment);
            $new_values->{'environment_id'} = $environment->id;
        }

        $run_id = $caserun->run_id;
        $case_id = $caserun->case_id;
        $build_id ||= $caserun->build->id;
        $env_id ||= $caserun->environment->id;
    
        # Check to see what has changed then use set methods
        # The order is important. We need to check if the build or environment has 
        # Changed so that we can switch to the right record first.
        if ($new_values->{'build_id'} && $new_values->{'environment_id'}){
            $caserun = $caserun->switch($new_values->{'build_id'}, $new_values->{'environment_id'}, $run_id, $case_id);
        }
        elsif ($new_values->{'build_id'}){
            $caserun = $caserun->switch($new_values->{'build_id'}, $env_id, $run_id, $case_id);
        }
        elsif ($new_values->{'environment_id'}){
            $caserun = $caserun->switch($build_id, $new_values->{'environment_id'}, $run_id, $case_id);
        }

        # Now that we know we are working with the right record, update it.
        if ($new_values->{'assignee'}){
            $caserun->set_assignee($new_values->{'assignee'});
        }
    
        if ($new_values->{'case_run_status_id'}){
            $caserun->set_status($new_values->{'case_run_status_id'}, $new_values->{'update_bugs'});
        }
    
        if ($new_values->{'sortkey'}){
            $caserun->set_sortkey($new_values->{'sortkey'});
        }
    
        if ($new_values->{'notes'}){
            $caserun->append_note($new_values->{'notes'});
        }
        
        if ($new_values->{'priority'}){
            delete $new_values->{'priority_id'};
            $caserun->set_priority($new_values->{'notes'});
            $caserun->update();
        }
        
        
        # Remove assignee user object and replace with just assignee id
        if (ref $caserun->{'assignee'} eq 'Bugzilla::User'){
            $caserun->{assignee} = $caserun->{assignee}->id();
        }
    
        # Result is modified test case run on success, otherwise an exception will be thrown
        return $caserun if scalar @caseruns == 1;
        push @results, $caserun;
    }
    return \@results;
}

sub lookup_status_id_by_name {
    my $self = shift;
    my ($params) = @_;
    
    if (ref $params ne 'HASH'){
        $params = {};
        $params->{name} = shift;
    } 

    Bugzilla->login(LOGIN_REQUIRED);

    # Result is test case run status id for the given test case run status name
    return Bugzilla::Extension::Testopia::TestCaseRun::lookup_status_by_name($params->{name});
}

sub lookup_status_name_by_id {
    my $self = shift;
    my ($params) = @_;

    if (ref $params ne 'HASH'){
        $params = {};
        $params->{id} = shift;
    } 

    Bugzilla->login(LOGIN_REQUIRED);

    # Result is test case run status name for the given test case run status id
    return Bugzilla::Extension::Testopia::TestCaseRun::lookup_status($params->{id});
}

sub get_history {
    my $self = shift;
    my ($params) = @_;

    if (ref $params ne 'HASH'){
        $params = {};
        $params->{run_id} = shift;
        $params->{case_id} = shift;
        $params->{build_id} = shift;
        $params->{env_id} = shift;
    } 

    Bugzilla->login(LOGIN_REQUIRED);

    my $caserun;
    if ($params->{id}){
        $caserun = new Bugzilla::Extension::Testopia::TestCaseRun($params->{id});
    }
    else {
        $caserun = new Bugzilla::Extension::Testopia::TestCaseRun($params->{run_id}, $params->{case_id}, $params->{build_id}, $params->{env_id});
    }

    ThrowUserError('invalid-test-id-non-existent', {type => 'Test Case Run', id => $params->{run_id}}) unless $caserun->{case_run_id};
    ThrowUserError('testopia-permission-denied', {'object' => $caserun}) unless $caserun->canview;

    return $caserun->get_case_run_list;

}

sub attach_bug {
    my $self = shift;
    my ($params) = @_;

    if (ref $params ne 'HASH'){
        $params = {};
        $params->{run_id} = shift;
        $params->{case_id} = shift;
        $params->{build_id} = shift;
        $params->{env_id} = shift;
        $params->{bug_ids} = shift;
    } 
    
    Bugzilla->login(LOGIN_REQUIRED);

    my $caserun;
    if ($params->{id}){
        $caserun = new Bugzilla::Extension::Testopia::TestCaseRun($params->{id});
    }
    else {
        $caserun = new Bugzilla::Extension::Testopia::TestCaseRun($params->{run_id}, $params->{case_id}, $params->{build_id}, $params->{env_id});
    }
    
    # If we have just the id, the third arg will not be set.
    $params->{bug_ids} = $params->{case_id} unless $params->{build_id};
    
    ThrowUserError('invalid-test-id-non-existent', {type => 'Test Case Run', id => $params->{run_id}}) unless $caserun->{case_run_id};
    ThrowUserError('testopia-read-only', {'object' => $caserun}) unless $caserun->canedit;
    
    $caserun->attach_bug($params->{bug_ids});
    
    return undef;
}

sub detach_bug {
    my $self = shift;
    my ($params) = @_;

    if (ref $params ne 'HASH'){
        $params = {};
        $params->{run_id} = shift;
        $params->{case_id} = shift;
        $params->{build_id} = shift;
        $params->{env_id} = shift;
        $params->{bug_id} = shift;
    } 

    Bugzilla->login(LOGIN_REQUIRED);

    my $caserun;
    if ($params->{id}){
        $caserun = new Bugzilla::Extension::Testopia::TestCaseRun($params->{id});
    }
    else {
        $caserun = new Bugzilla::Extension::Testopia::TestCaseRun($params->{run_id}, $params->{case_id}, $params->{build_id}, $params->{env_id});
    }
    
    # If we have just the id, the third arg will not be set.
    $params->{bug_id} = $params->{case_id} unless $params->{build_id};
    
    ThrowUserError('invalid-test-id-non-existent', {type => 'Test Case Run', id => $params->{run_id}}) unless $caserun->{case_run_id};
    ThrowUserError('testopia-read-only', {'object' => $caserun}) unless $caserun->canedit;
    
    $caserun->detach_bug($params->{bug_id});
    
    # Result undef on success, otherwise an exception will be thrown
    return undef;
}

sub get_bugs {
    my $self = shift;
    my ($params) = @_;

    if (ref $params ne 'HASH'){
        $params = {};
        $params->{run_id} = shift;
        $params->{case_id} = shift;
        $params->{build_id} = shift;
        $params->{env_id} = shift;
    } 

    Bugzilla->login(LOGIN_REQUIRED);

    my $caserun;
    if ($params->{id}){
        $caserun = new Bugzilla::Extension::Testopia::TestCaseRun($params->{id});
    }
    else {
        $caserun = new Bugzilla::Extension::Testopia::TestCaseRun($params->{run_id}, $params->{case_id}, $params->{build_id}, $params->{env_id});
    }

    ThrowUserError('invalid-test-id-non-existent', {type => 'Test Case Run', id => $params->{run_id}}) unless $caserun->{case_run_id};
    ThrowUserError('testopia-permission-denied', {'object' => $caserun}) unless $caserun->canview;

    return $caserun->bugs;
}

sub get_completion_time {
    my $self = shift;
    my ($params) = @_;

    if (ref $params ne 'HASH'){
        $params = {};
        $params->{run_id} = shift;
        $params->{case_id} = shift;
        $params->{build_id} = shift;
        $params->{env_id} = shift;
    } 

    Bugzilla->login(LOGIN_REQUIRED);

    my $caserun;
    if ($params->{id}){
        $caserun = new Bugzilla::Extension::Testopia::TestCaseRun($params->{id});
    }
    else {
        $caserun = new Bugzilla::Extension::Testopia::TestCaseRun($params->{run_id}, $params->{case_id}, $params->{build_id}, $params->{env_id});
    }

    ThrowUserError('invalid-test-id-non-existent', {type => 'Test Case Run', id => $params->{run_id}}) unless $caserun->{case_run_id};
    ThrowUserError('testopia-permission-denied', {'object' => $caserun}) unless $caserun->canview;

    return $caserun->completion_time;
}

1;

__END__

=head1 NAME

Testopia::Webservice::TestCaseRun

=head1 EXTENDS

Bugzilla::Webservice

=head1 DESCRIPTION

Provides methods for automated scripts to manipulate Testopia TestCaseRuns.

=head1 SYNOPSIS

Test case-runs are the mapping of a test case in a given run for a particular 
build and environment. There are therefore two ways to refer to a given 
case-run:

    By ID: The unique case_run_id
    By Combination: $run_id, $case_id, $build_id, $environment_id

TestCaseRun methods are overloaded to support either of these two
methods of looking up the case-run you are interested in.

B<EXAMPLE:>

TestCaseRun->get($caserun_id)
TestCaseRun->get($run_id, $case_id, $build_id, $environment_id)

=head1 METHODS

=over

=item C<attach_bug>

 Description: Add one or more bugs to the selected test case-runs.

 Params:      $id - Integer: An integer representing the ID in the database.

              $bug_ids - Integer/Array/String: An integer or alias representing the ID in the database,
                  an array of bug_ids or aliases, or a string of comma separated bug_ids. 

 Returns:     undef.

=item C<attach_bug>

 Description: Add one or more bugs to the selected test case-runs.

 Params:      $run_id - Integer: An integer representing the ID of the test run in the database.
              $case_id - Integer: An integer representing the ID of the test case in the database.
              $build_id - Integer: An integer representing the ID of the test build in the database.
              $env_id - Integer: An integer representing the ID of the environment in the database.

              $bug_ids - Integer/Array/String: An integer or alias representing the ID in the database,
                  an array of bug_ids or aliases, or a string of comma separated bug_ids. 

 Returns:     undef.

=item C<create>

 Description: Creates a new Test Case Run object and stores it in the database.

 Params:      $values - Hash: A reference to a hash with keys and values  
              matching the fields of the test case to be created. 
  +--------------------+----------------+-----------+------------------------------------------------+
  | Field              | Type           | Null      | Description                                    |
  +--------------------+----------------+-----------+------------------------------------------------+
  | run_id             | Integer        | Required  | Test Run Number                                |
  | case_id            | Integer/String | Required  | ID or alias of test case                       |
  | build              | Integer/String | Required  | ID or name of a Build in plan's product        |
  | environment        | Integer/String | Required  | ID or name of an Environment in plan's product |
  | priority           | Integer/String | Optional  | ID or name of priority. Default same as case   |
  | assignee           | Integer/String | Optional  | Defaults to test case default tester           |
  | status             | String         | Optional  | Defaults to "IDLE"                             |
  | case_text_version  | Integer        | Optional  |                                                |
  | notes              | String         | Optional  |                                                |
  | sortkey            | Integer        | Optional  | a.k.a. Index                                   |
  +--------------------+----------------+-----------+------------------------------------------------+
    Valid statuses include: IDLE, PASSED, FAILED, RUNNING, PAUSED, BLOCKED, ERROR

 Returns:     The newly created object hash.

=item C<detach_bug>

 Description: Remove a bug from a test case-run.

 Params:      $id - Integer: An integer representing the ID in the database.

              $bug_ids - Integer/Array/String: An integer or alias representing the ID in the database,
                  an array of bug_ids or aliases, or a string of comma separated bug_ids. 

 Returns:     undef.

=item C<detach_bug>

 Description: Remove a bug from a test case-run.

 Params:      $run_id - Integer: An integer representing the ID of the test run in the database.
              $case_id - Integer: An integer representing the ID of the test case in the database.
              $build_id - Integer: An integer representing the ID of the test build in the database.
              $env_id - Integer: An integer representing the ID of the environment in the database.

              $bug_id - Integer: An integer or alias representing the ID of 
                  the bug in the database,

 Returns:     undef.

=item C<get>

 Description: Used to load an existing test case-run from the database.

 Params:      $id - Integer: An integer representing the ID in
                  the database for this case-run.

 Returns:     A blessed Bugzilla::Extension::Testopia::TestCaseRun object hash

=item C<get>

 Description: Used to load an existing test case from the database.

 Params:      $run_id - Integer: An integer representing the ID of the test run in the database.
              $case_id - Integer: An integer representing the ID of the test case in the database.
              $build_id - Integer: An integer representing the ID of the test build in the database.
              $env_id - Integer: An integer representing the ID of the environment in the database.

 Returns:     A blessed Bugzilla::Extension::Testopia::TestCaseRun object hash

=item C<get_bugs>

 Description: Get the list of bugs that are associated with this test case.

 Params:      $id - Integer: An integer representing the ID in
                  the database for this case-run.

 Returns:     Array: An array of bug object hashes.

=item C<get_bugs>

 Description: Get the list of bugs that are associated with this test case.

 Params:      $run_id - Integer: An integer representing the ID of the test run in the database.
              $case_id - Integer: An integer representing the ID of the test case in the database.
              $build_id - Integer: An integer representing the ID of the test build in the database.
              $env_id - Integer: An integer representing the ID of the environment in the database.

 Returns:     Array: An array of bug object hashes.

=item C<get_completion_time>

 Description: Returns the time in seconds that it took for this case to complete.

 Params:      $id - Integer: An integer representing the ID in
                  the database for this case-run.

 Returns:     Integer: Seconds since run was started till this case was completed.

=item C<get_completion_time>

 Description: Returns the time in seconds that it took for this case to complete.

 Params:      $run_id - Integer: An integer representing the ID of the test run in the database.
              $case_id - Integer: An integer representing the ID of the test case in the database.
              $build_id - Integer: An integer representing the ID of the test build in the database.
              $env_id - Integer: An integer representing the ID of the environment in the database.

 Returns:     Integer: Seconds since run was started till this case was completed.

=item C<get_history>

 Description: Get the list of case-runs for all runs this case appears in.
              To limit this list by build or other attribute, see TestCaseRun::list.

 Params:      $id - Integer: An integer representing the ID in
                  the database for this case-run.

 Returns:     Array: An array of case-run object hashes.

=item C<get_history>

 Description: Get the list of case-runs for all runs this case appears in.
              To limit this list by build or other attribute, see TestCaseRun::list.

 Params:      $run_id - Integer: An integer representing the ID of the test run in the database.
              $case_id - Integer: An integer representing the ID of the test case in the database.
              $build_id - Integer: An integer representing the ID of the test build in the database.
              $env_id - Integer: An integer representing the ID of the environment in the database.

 Returns:     Array: An array of case-run object hashes.

=item C<list>

 Description: Performs a search and returns the resulting list of test cases.

 Params:      $query - Hash: keys must match valid search fields.

    +--------------------------------------------------------+
    |               Case-Run Search Parameters               |
    +--------------------------------------------------------+
    |        Key          |          Valid Values            |
    | andor               | 1: Author AND tester, 0: OR      |
    | assignee            | A bugzilla login (email address) |
    | assignee_type       | (select from email_variants)     |
    | build               | String                           |
    | build_id            | Integer                          |
    | case_id             | comma separated integers         |
    | case_run_status     | String: Status                   |
    | case_run_status_id  | Integer: Status                  |
    | case_summary        | String: Requirement              |
    | case_summary_type   | (select from query_variants)     |
    | category            | String: Category Name            |
    | category_id         | Integer                          |
    | component           | String: Component Name           |
    | environment         | String                           |
    | environment_id      | Integer                          |
    | isactive            | 0: Only show current 1: show all |
    | isautomated         | 1: true 0: false                 |
    | milestone           | String                           |
    | notes               | String                           |
    | notes_type          | (select from query_variants)     |
    | plan_id             | comma separated integers         |
    | priority            | String: Priority                 |
    | priority_id         | Integer                          |
    | product             | String                           |
    | product_id          | Integer                          |
    | requirement         | String: Requirement              |
    | requirement_type    | (select from query_variants)     |
    | run_id              | comma separated integers         |
    | run_product_version | String                           |
    | run_status          | 1: RUNNING 0: STOPPED            |
    | tags                | String                           |
    | tags_type           | (select from tag_variants)       |
    | testedby            | A bugzilla login (email address) |
    | testedby_type       | (select from email_variants)     |
    +--------------------------------------------------------+

    +---------------------------------------------------+
    |                Paging and Sorting                 |
    +---------------------------------------------------+
    |      Key       |            Description           |
    | dir            | "ASC" or "DESC"                  |
    | order          | field to sort by                 |
    +---------------------------------------------------+
    | page_size      | integer: how many per page       |
    | page           | integer: page number             |
    |            +++++++ OR +++++++                     |
    | start          | integer: Start with which record |
    | limit          | integer: limit to how many       |
    +---------------------------------------------------+
    | viewall        | 1: returns all records           |
    +---------------------------------------------------+
      * The default is to only return 25 records at a time

    +----------------------------------------------------+
    |                 query_variants                     |
    +----------------+-----------------------------------+
    |      Key       |            Description            |
    | allwordssubstr | contains all of the words/strings |
    | anywordssubstr | contains any of the words/strings |
    | substring      | contains the string               |
    | casesubstring  | contains the string (exact case)  |
    | allwords       | contains all of the words         |
    | anywords       | contains any of the words         |
    | regexp         | matches the regexp                |
    | notregexp      | doesn't match the regexp          |
    +----------------+-----------------------------------+

            +-------------------------------------+
            |            email_variants           |
            +--------------+----------------------+
            |      Key     |      Description     |
            | substring    | contains             |
            | exact        | is                   |
            | regexp       | matches regexp       |
            | notregexp    | doesn't match regexp |
            +--------------+----------------------+

    +----------------------------------------------------+
    |                    tag_variants                    |
    +----------------+-----------------------------------+
    |      Key       |            Description            |
    | anyexact       | is tagged with                    |
    | allwordssubstr | contains all of the words/strings |
    | anywordssubstr | contains any of the words/strings |
    | substring      | contains the string               |
    | casesubstring  | contains the string (exact case)  |
    | regexp         | matches the regexp                |
    | notregexp      | doesn't match the regexp          |
    | allwords       | contains all of the words         |
    | anywords       | contains any of the words         |
    | nowords        | contains none of the words        | 
    +----------------------------------------------------+

 Returns:     Array: Matching test cases are retuned in a list of hashes.

=item C<list_count>

 Description: Performs a search and returns the resulting count of cases.

 Params:      $query - Hash: keys must match valid search fields (see list).

 Returns:     Integer - total matching cases.

=item lookup_status_name_by_id 

 Params:      $id - Integer: ID of the status to return

 Returns:     String: the status name.

=item lookup_status_id_by_name

 Params:      $name - String: the status name. 

 Returns:     Integer: ID of the status.

=item C<update>

 Description: Updates the fields of the selected case-runs.

 Params:      $ids - Integer/String/Array
                     Integer: A single TestCaseRun ID.
                     String:  A comma separates string of TestCaseRun IDs for batch
                              processing.
                     Array:   An array of TestCaseRun IDs for batch mode processing

              $values - Hash of keys matching TestCaseRun fields and the new values 
              to set each field to.
                      +--------------------+----------------+
                      | Field              | Type           |
                      +--------------------+----------------+
                      | build              | Integer/String |
                      | environment        | Integer/String |
                      | assignee           | Integer/String |
                      | priority           | Integer/String |
                      | status             | String         |
                      | notes              | String         |
                      | sortkey            | Integer        |
                      | update_bugs        | Boolean        | 1: Reopen bugs on FAILED 0: Don't change bug status 
                      +--------------------+----------------+ 

 Returns:     Hash/Array: In the case of a single object, it is returned. If a 
              list was passed, it returns an array of object hashes. If the
              update on any particular object failed, the hash will contain a 
              ERROR key and the message as to why it failed.

=item C<update>

 Description: Updates the fields of the selected case-run.

 Params:      $run_id - Integer: An integer representing the ID of the test run in the database.
              $case_id - Integer: An integer representing the ID of the test case in the database.
              $build_id - Integer: An integer representing the ID of the test build in the database.
              $env_id - Integer: An integer representing the ID of the environment in the database.

              $values - Hash of keys matching TestCaseRun fields and the new values 
              to set each field to. See above.

 Returns:     Hash/Array: In the case of a single object, it is returned. If a 
              list was passed, it returns an array of object hashes. If the
              update on any particular object failed, the hash will contain a 
              ERROR key and the message as to why it failed.

=back

=head1 SEE ALSO

L<Bugzilla::Extension::Testopia::TestCaseRun>
L<Bugzilla::Webservice> 

=head1 AUTHOR

Greg Hendricks <ghendricks@novell.com>