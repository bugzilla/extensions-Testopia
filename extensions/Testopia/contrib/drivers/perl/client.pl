#!/usr/bin/perl
# -d:ptkdb
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
# Contributor(s): Dallas Harken <dharken@novell.com>

=head1 NAME

client.pl - Show how to talk to Bugzilla Testopia via XMLRPC

=head1 SYNOPSIS

C<client.pl [options]>

C<client_demo.pl --help> for detailed help

=head1 OPTIONS

=over

=item --help, -h, -?

Print a short help message and exit.

=item --uri

URI to Bugzilla's C<tr_xmlrpc.cgi> script, along the lines of
C<http://your.bugzilla.installation/path/to/bugzilla/tr_xmlrpc.cgi>.

=item --login

Bugzilla login name. Specify this together with B<--password> in order to log in.

=item --password

Bugzilla password. Specify this together with B<--login> in order to log in.

=cut

use strict;
use Getopt::Long;
use Pod::Usage;
use XMLRPC::Lite;
use File::Basename qw(dirname);
use HTTP::Cookies;
use Carp;
use Data::Dumper;

my $help;
my $Bugzilla_uri;
my $Bugzilla_login;
my $Bugzilla_password;
my $soapresult;

sub SOAP::Transport::HTTP::Client::get_basic_credentials { 
    return $Bugzilla_login => $Bugzilla_password;
}

sub show_results {
    my $plan;
    my $key;

    my ($header, $soapresult) = @_;

    print $header . "\n";
    
    if (!defined $soapresult)
    {
      print "No Soap Result - Probably no method call made.\n";
      exit(2);
    }

    die_on_fault($soapresult);

    print Dumper($soapresult->result);

}

sub die_on_fault {
    my $soapresult = shift;

    if ($soapresult->fault){
        confess 'Fault: ' . $soapresult->faultcode . ' ' . $soapresult->faultstring;
    }
}

sub syntaxhelp {
    my $msg = shift;

    print "Error: $msg\n";
    pod2usage({'-verbose' => 0, '-exitval' => 1});
}

#####################################################################################
#
# Code Execution Starts Here
#
#####################################################################################

GetOptions('help|h|?'       => \$help,
           'uri=s'          => \$Bugzilla_uri,
           'login=s'        => \$Bugzilla_login,
           'password=s'     => \$Bugzilla_password,
          ) or pod2usage({'-verbose' => 0, '-exitval' => 1});

pod2usage({'-verbose' => 1, '-exitval' => 0}) if $help;

syntaxhelp('URI unspecified') unless $Bugzilla_uri;

my $cookie_jar =
    new HTTP::Cookies('file' => File::Spec->catdir(dirname($0), 'cookies.txt'),
                      'autosave' => 1);

my $proxy = XMLRPC::Lite->proxy($Bugzilla_uri,
                                'cookie_jar' => $cookie_jar);

if (defined($Bugzilla_login)) {
    if ($Bugzilla_login ne '') {
        # Log in.
        $soapresult = $proxy->call('User.login',
                                   { login => $Bugzilla_login, 
                                     password => $Bugzilla_password,
                                     remember => 1 } );
        print "Login successful.\n";
    }
    else {
        # Log out.
        $soapresult = $proxy->call('User.logout');
        print "Logout successful.\n";
    }
}

#$soapresult = $proxy->call('Bugzilla.version');
#$soapresult = $proxy->call('Bugzilla.extensions');
#$soapresult = $proxy->call('Testopia.testopia_version');
#$soapresult = $proxy->call('Testopia.api_version');

#####################
### Build Methods ###
#####################

#$soapresult = $proxy->call('Build.check_build', {name => 'Linux', product => 1});
#$soapresult = $proxy->call('Build.check_build', {name => 'Linux', product => 'TestProduct'});
#$soapresult = $proxy->call('Build.create', {name=>'Build '. time(), product_id=>1, isactive=>0, description=> 'API Test Build - IGNORE'});
#$soapresult = $proxy->call('Build.get', {id => 1});
#$soapresult = $proxy->call('Build.get_caseruns', {id => 1});
#$soapresult = $proxy->call('Build.get_runs', {id => 1});
#$soapresult = $proxy->call('Build.update', { id => 1, description=>'This is a description', milestone=>'---', isactive=>0});

###########################
### Environment Methods ###
###########################
#$soapresult = $proxy->call('Environment.check_environment', {name => 'Linux', product => 1});
#$soapresult = $proxy->call('Environment.check_environment', {name => 'Linux', product => 'TestProduct'});
#$soapresult = $proxy->call('Environment.create', {product_id=>1, name=>'Environment '.time() , isactive=>1});
#$soapresult = $proxy->call('Environment.get', {id => 1});
#$soapresult = $proxy->call('Environment.list', {environment_id=>1});
#$soapresult = $proxy->call('Environment.list', {name=>'Linux'});
#$soapresult = $proxy->call('Environment.update', {id=>1, name=>'Second Environment'});
#$soapresult = $proxy->call('Environment.get_runs', {id => 1});
#$soapresult = $proxy->call('Environment.get_caseruns', {id => 1});
#$soapresult = $proxy->call('Environment.create_full', {name => "My Environment", product => 1, 
#    environment => {
#        Database => {
#            Looly =>{
#                lum => 'lee', 
#                loo => 'low'
#            },
#            Lumdy => {
#                lor => 'lee'
#            }
#        }
#    }});

#######################
### Product Methods ###
#######################

#$soapresult = $proxy->call('TestopiaProduct.check_product', {name => 'TestProduct'});
#$soapresult = $proxy->call('TestopiaProduct.check_category', {name => '--default--', product => 'TestProduct'});
#$soapresult = $proxy->call('TestopiaProduct.get', {id => 1});
#$soapresult = $proxy->call('TestopiaProduct.get', {name => 'TestProduct'});
#$soapresult = $proxy->call('TestopiaProduct.get_builds', {name => 'TestProduct'});
#$soapresult = $proxy->call('TestopiaProduct.get_cases', {id => 1});
#$soapresult = $proxy->call('TestopiaProduct.get_categories', {name => 'TestProduct'});
#$soapresult = $proxy->call('TestopiaProduct.get_components', {name => 'TestProduct'});
#$soapresult = $proxy->call('TestopiaProduct.get_component', {id=>1});
#$soapresult = $proxy->call('TestopiaProduct.get_component', {name => 'TestComponent', product => 'TestProduct'});
#$soapresult = $proxy->call('TestopiaProduct.get_environments', {name => 'TestProduct'});
#$soapresult = $proxy->call('TestopiaProduct.get_milestones', {name => 'TestProduct'});
#$soapresult = $proxy->call('TestopiaProduct.get_plans', {name => 'TestProduct'});
#$soapresult = $proxy->call('TestopiaProduct.get_runs', {name => 'TestProduct'});
#$soapresult = $proxy->call('TestopiaProduct.get_tags', {name => 'TestProduct'});
#$soapresult = $proxy->call('TestopiaProduct.get_versions', {name => 'TestProduct'});

########################
### TestCase Methods ###
########################

#$soapresult = $proxy->call('TestCase.add_component', {case_ids => [1,2], components => [1]});
#$soapresult = $proxy->call('TestCase.add_component', {case_ids => [1,2], components => [{product => "TestProduct", component => "TestComponent"}]});
#$soapresult = $proxy->call('TestCase.add_tag', {case_ids => [1,2], tags => ['Fred','Fish']});
#$soapresult = $proxy->call('TestCase.add_to_run', {case_ids => [1,2], run_ids => [1,2]});
#$soapresult = $proxy->call('TestCase.attach_bug', {case_ids =>[1,2], bug_ids => [1,2]});
#$soapresult = $proxy->call('TestCase.calculate_average_time', {id => 1});
#$soapresult = $proxy->call('TestCase.create', {status => 'CONFIRMED', category => '--default--', priority => 'Low', summary => 'API TEST CASE', plans => [1]});
#$soapresult = $proxy->call('TestCase.create', [{status => 'CONFIRMED', category => '--default--', priority => 'Low', summary => 'API TEST CASE', plans => [1]}]);
#$soapresult = $proxy->call('TestCase.detach_bug', {case_id => 1, bug_ids => 1});
#$soapresult = $proxy->call('TestCase.get', {id => 1});
#$soapresult = $proxy->call('TestCase.get_bugs', {id => 1});
#$soapresult = $proxy->call('TestCase.get_case_run_history', {id => 1});
#$soapresult = $proxy->call('TestCase.get_change_history', {id => 1});
#$soapresult = $proxy->call('TestCase.get_components', {id => 1});
#$soapresult = $proxy->call('TestCase.get_plans', {id => 1});
#$soapresult = $proxy->call('TestCase.get_tags', {id => 1});
#$soapresult = $proxy->call('TestCase.get_text', {case_id => 1, version => 1});
#$soapresult = $proxy->call('TestCase.link_plan', {case_id => 1, plan_ids => [1,2]});
#$soapresult = $proxy->call('TestCase.list', {default_tester => 'ghendricks@novell.com'});
#$soapresult = $proxy->call('TestCase.list', {pagesize => 1000, page => 0, isautomated => 1});
#$soapresult = $proxy->call('TestCase.lookup_priority_id_by_name', {name => 'Low'});
#$soapresult = $proxy->call('TestCase.lookup_priority_name_by_id', {id => 3});
#$soapresult = $proxy->call('TestCase.lookup_status_id_by_name', {name =>'CONFIRMED'});
#$soapresult = $proxy->call('TestCase.lookup_status_name_by_id', {id => 1});
#$soapresult = $proxy->call('TestCase.remove_component', {case_ids => [1], component_id => 1});
#$soapresult = $proxy->call('TestCase.remove_tag', {case_ids => [1], tag => 'fish'});
#$soapresult = $proxy->call('TestCase.store_text', {case_id => 1, action => 'FOO', effect => 'FISH', setup => 'FIGHT', breakdown => 'FUN', author_id => 'ghendricks@novell.com'});
#$soapresult = $proxy->call('TestCase.unlink_plan', {case_id => 1, plan_id => 1});
#$soapresult = $proxy->call('TestCase.update', {ids => [1], priority_id => 'High', case_status_id=>3 ,summary=>'This was Entering bugs', category_id => '1'});


###########################
### TestCaseRun Methods ###
###########################

#$soapresult = $proxy->call('TestCaseRun.attach_bug', {case_id => 1, run_id => 6, build_id => 1, env_id => 2, bug_ids => [1,2]} );
#$soapresult = $proxy->call('TestCaseRun.attach_bug', {id => 1, bug_ids => 1});
#$soapresult = $proxy->call('TestCaseRun.create', {case_id => 1, run_id => 1, build_id => 1, environment_id => 1});
#$soapresult = $proxy->call('TestCaseRun.detach_bug', {id => 5, bug_id => 3});
#$soapresult = $proxy->call('TestCaseRun.get', {id => 1});
#$soapresult = $proxy->call('TestCaseRun.get', {case_id => 1, run_id => 1, build_id => 1, env_id => 1});
#$soapresult = $proxy->call('TestCaseRun.get_bugs', {id => 3});
#$soapresult = $proxy->call('TestCaseRun.get_bugs', {case_id => 3, run_id => 1, build_id => 1, env_id=>1});
#$soapresult = $proxy->call('TestCaseRun.get_completion_time', {id => 3});
#$soapresult = $proxy->call('TestCaseRun.get_history', {id => 3});
#$soapresult = $proxy->call('TestCaseRun.list', {pagesize => 1000, page => 0, run_id => 1, isautomated => 1, isactive=>0});
#$soapresult = $proxy->call('TestCaseRun.list', {pagesize => 10, page => 0, isautomated => 1});
#$soapresult = $proxy->call('TestCaseRun.lookup_status_id_by_name', {name => 'PASSED'});
#$soapresult = $proxy->call('TestCaseRun.lookup_status_name_by_id', {id => 3});
#$soapresult = $proxy->call('TestCaseRun.update', {ids => [9,3], status => 2});

########################
### TestPlan Methods ###
########################

#$soapresult = $proxy->call('TestPlan.add_tag', {plan_ids => 74, tags => 'Fish'});
#$soapresult = $proxy->call('TestPlan.create', {product_id => 'TestProduct', name=>'API TEST PLAN', type_id=>'Integration', default_product_version=>'unspecified'});
#$soapresult = $proxy->call('TestPlan.get', {id => 1});
#$soapresult = $proxy->call('TestPlan.get_change_history', {id => 1});
#$soapresult = $proxy->call('TestPlan.get_product', {id => 1});
#$soapresult = $proxy->call('TestPlan.get_tags', {id => 1});
#$soapresult = $proxy->call('TestPlan.get_test_cases', {id => 1});
#$soapresult = $proxy->call('TestPlan.get_case_tags', {id => 1});
#$soapresult = $proxy->call('TestPlan.get_test_runs', {id => 1});
#$soapresult = $proxy->call('TestPlan.get_text', {plan_id => 1, version => 1});
#$soapresult = $proxy->call('TestPlan.list', {product_id=>1, name=> 'selenium'});
#$soapresult = $proxy->call('TestPlan.lookup_type_id_by_name', {name => 'Integration'});
#$soapresult = $proxy->call('TestPlan.lookup_type_name_by_id', {id => 1});
#$soapresult = $proxy->call('TestPlan.remove_tag', {plan_id => 1, tag => 'Fish'});
#$soapresult = $proxy->call('TestPlan.store_text', {plan_id => 1, text => 'THIS IS A TEST OF THE PLAN TEXT VIA API'});
#$soapresult = $proxy->call('TestPlan.update', {id => 1, name=>'API UPDATE', type=>'unit', default_product_version=> 'unspecified'});

#######################
### TestRun Methods ###
#######################

#$soapresult = $proxy->call('TestRun.add_cases', {case_ids => [1], run_ids => [1]});
#$soapresult = $proxy->call('TestRun.add_tag', {run_ids => [1], tag => "Fish"});
#$soapresult = $proxy->call('TestRun.create', {plan_id => 1, environment => 'Linux', build => 'Linux', summary => 'API TEST RUN', manager_id => 'ghendricks@novell.com', product_version=>'unspecified', status => 1});
#$soapresult = $proxy->call('TestRun.get', {id => 1});
#$soapresult = $proxy->call('TestRun.get_change_history', {id => 1});
#$soapresult = $proxy->call('TestRun.get_completion_report', {runs => 1});
#$soapresult = $proxy->call('TestRun.get_tags', {id => 1});
#$soapresult = $proxy->call('TestRun.get_test_case_runs', {id => 1, current => 1});
#$soapresult = $proxy->call('TestRun.get_test_cases', {id => 1});
#$soapresult = $proxy->call('TestRun.get_case_tags', {id => 1});
#$soapresult = $proxy->call('TestRun.get_test_plan', {id => 1});
#$soapresult = $proxy->call('TestRun.list', {build => 'Linux'});
#$soapresult = $proxy->call('TestRun.remove_tag', {run_id => 1, tag => 'fish'});
#$soapresult = $proxy->call('TestRun.update', {id =>1, environment_id => 'Linux', build_id => 'linux', summary => 'API TEST RUN', manager_id => 'ghendricks@novell.com', product_version=>'unspecified'});

#$soapresult = $proxy->call('TestopiaUser.lookup_login_by_id', {id => 1} );
#$soapresult = $proxy->call('TestopiaUser.lookup_id_by_login', {login => 'gregaryh@gmail.com'} );

show_results('The results are: ', $soapresult);

