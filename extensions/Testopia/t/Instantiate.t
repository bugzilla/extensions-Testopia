#!/usr/bin/perl -w

use lib '../..';
use strict;

use Test::More tests => 42;
use Test::Deep;

use Bugzilla;
use Bugzilla::Constants;

use Testopia::Attachment;
use Testopia::Build;
use Testopia::Category;
use Testopia::Classification;
use Testopia::Environment;
use Bugzilla::Extension::Testopia::Environment::Category;
use Bugzilla::Extension::Testopia::Environment::Element;
use Bugzilla::Extension::Testopia::Environment::Property;
use Testopia::Product;
use Testopia::TestCase;
use Testopia::TestCaseRun;
use Testopia::TestPlan;
use Testopia::TestRun;
use Testopia::TestTag;

use Bugzilla::Extension::Testopia::Test::Util;

Bugzilla->error_mode(ERROR_MODE_DIE);


my $db_obj;

my @tables =
  qw(test_attachments test_builds test_case_categories test_environments
  test_environment_category test_environment_element test_environment_property
  test_cases test_case_runs test_plans test_runs test_tags products classifications);

foreach my $table (@tables) {
    $db_obj = get_rep($table);
#    my $is = ok(defined($db_obj), "No Value in Database for Table $table");
#    next unless $is; 

# If the table has no data, we do not test it
# otherwise we check it's contents 

if (defined $db_obj){
  SWITCH: for ($table) {
        /attachments/ && do {    
            my $obj = new Bugzilla::Extension::Testopia::Attachment( $db_obj->{'attachment_id'} );

            ok( defined $obj, "Testing Attachment Instantiation" );
            isa_ok( $obj, 'BugzillaTestopia::Attachment' );
            cmp_deeply( $db_obj, noclass($obj), "DB and Object fields match" );
            last SWITCH;
        };
        /builds/ && do {
            my $obj = new Bugzilla::Extension::Testopia::Build( $db_obj->{'build_id'} );

            ok( defined $obj, "Testing Build Instantiation" );
            isa_ok( $obj, 'Testopia::Build' );
            cmp_deeply( $db_obj, noclass($obj), "DB and Object fields match" );
            last SWITCH;
        };
        /case_categories/ && do{
            my $obj = new Bugzilla::Extension::Testopia::Category( $db_obj->{'category_id'} );

            ok( defined $obj, "Testing Build Instantiation" );
            isa_ok( $obj, 'Testopia::Category' );
            cmp_deeply( $db_obj, noclass($obj), "DB and Object fields match" );        	
        	last SWITCH;
        };
        /environments/ && do{
            my $obj = new Bugzilla::Extension::Testopia::Environment( $db_obj->{'environment_id'} );

            ok( defined $obj, "Testing Build Instantiation" );
            isa_ok( $obj, 'Testopia::Environment' );
            cmp_deeply( $db_obj, noclass($obj), "DB and Object fields match" );        	
        	last SWITCH;       	
        };
        /environment_category/ && do{
            my $obj = new Bugzilla::Extension::Testopia::Environment::Category( $db_obj->{'env_category_id'} );

            ok( defined $obj, "Testing Build Instantiation" );
            isa_ok( $obj, 'Testopia::Environment::Category' );
            cmp_deeply( $db_obj, noclass($obj), "DB and Object fields match" );        	
        	last SWITCH;       	
        };
         /environment_element/ && do{
            my $obj = new Bugzilla::Extension::Testopia::Environment::Element( $db_obj->{'element_id'} );

            ok( defined $obj, "Testing Build Instantiation" );
            isa_ok( $obj, 'Testopia::Environment::Element' );
			
			# We need to delete this because it is not in the database
			# We check the get_properties subroutine somewhere else though
			delete $obj->{'properties'};
            cmp_deeply( $db_obj, noclass($obj), "DB and Object fields match" );        	
        	last SWITCH;
        };
        /environment_property/ && do{
            my $obj = new Bugzilla::Extension::Testopia::Environment::Property( $db_obj->{'property_id'} );

            ok( defined $obj, "Testing Build Instantiation" );
            isa_ok( $obj, 'Testopia::Environment::Property' );
            cmp_deeply( $db_obj, noclass($obj), "DB and Object fields match" );        	
        	last SWITCH;       	
        };
        /cases/ && do{
            my $obj = new Bugzilla::Extension::Testopia::TestCase( $db_obj->{'case_id'} );

            ok( defined $obj, "Testing Build Instantiation" );
            isa_ok( $obj, 'Testopia::TestCase' );
            cmp_deeply( $db_obj, noclass($obj), "DB and Object fields match" );        	
        	last SWITCH;       	
        };
        /case_runs/ && do{    
        	my $obj = new Bugzilla::Extension::Testopia::TestCaseRun( $db_obj->{'case_run_id'} );

            ok( defined $obj, "Testing Build Instantiation" );
            isa_ok( $obj, 'Testopia::TestCaseRun' );
            cmp_deeply( $db_obj, noclass($obj), "DB and Object fields match" );        	
        	last SWITCH;       	
        };
        /plans/ && do{
        	my $obj = new Bugzilla::Extension::Testopia::TestPlan( $db_obj->{'plan_id'} );

            ok( defined $obj, "Testing Build Instantiation" );
            isa_ok( $obj, 'Testopia::TestPlan' ); 
            cmp_deeply( $db_obj, noclass($obj), "DB and Object fields match" );        	
        	last SWITCH;       	
        };
        /runs/ && do{
        	my $obj = new Bugzilla::Extension::Testopia::TestRun( $db_obj->{'run_id'} );

            ok( defined $obj, "Testing Build Instantiation" );
            isa_ok( $obj, 'Testopia::TestRun' );

            cmp_deeply( $db_obj, noclass($obj), "DB and Object fields match" );        	
        	last SWITCH;       		
        };
        /tags/ && do{
        	my $obj = new Bugzilla::Extension::Testopia::TestTag( $db_obj->{'tag_id'} );

            ok( defined $obj, "Testing Build Instantiation" );
            isa_ok( $obj, 'Testopia::TestTag' );
            cmp_deeply( $db_obj, noclass($obj), "DB and Object fields match" );        	
        	last SWITCH;       	
        };
        /products/ && do{
        	my $obj = new Bugzilla::Extension::Testopia::Product( $db_obj->{'id'} );

            ok( defined $obj, "Testing Build Instantiation" );
            isa_ok( $obj, 'Testopia::Product' );

            cmp_deeply( $db_obj, noclass($obj), "DB and Object fields match" );        	
        	last SWITCH;       	
        }; 
        /classifications/ && do{
			my $obj = new Bugzilla::Extension::Testopia::Classification( $db_obj->{'id'} );

            ok( defined $obj, "Testing Build Instantiation" );
            isa_ok( $obj, 'Testopia::Classification' );
            cmp_deeply( $db_obj, noclass($obj), "DB and Object fields match" );        	
        	last SWITCH;       	
        };
    } }
}
