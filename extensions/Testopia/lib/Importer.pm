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
# Contributor(s): David Koenig   <dkoenig@novell.com>
#                 Greg Hendricks <ghendricks@novell.com>
#                 Jeff Dayley    <jedayley@novell.com>

package Bugzilla::Extension::Testopia::Importer;

use strict;

use Bugzilla::Error;
use Bugzilla::Extension::Testopia::Attachment;
use Bugzilla::Extension::Testopia::TestPlan;
use Bugzilla::Extension::Testopia::TestCase;
use Bugzilla::Extension::Testopia::Category;

use Class::Struct;
use Data::Dumper;
use MIME::Base64;
use XML::Validator::Schema;

local our @attachments;
local our @caseruns;
local our @cases;
local our @plans;
local our @runs;
local our $xref = { 'cases' => {}, 'plans' => {}, 'runs' => {} };
local our $debug = 0;

struct( 'Bugzilla::Extension::Testopia::Importer', {debug => '$'} );

sub _check_category {
    my ( $twig, $e ) = @_;
    print "Checking categories...\n" if $debug;
    my $product = Bugzilla::Product::check_product( $e->field('tr:product') );
    if ( !Testopia::Category::check_case_category( $e->field('tr:name'), $product ) ) {
        Bugzilla::Extension::Testopia::Category->create(
            {
                product_id => $product->id,
                name       => $e->field('tr:name'),
            }
        );
    }
    return 1;
}

sub _check_build {
    my ( $twig, $e ) = @_;
    print "Checking builds...\n" if $debug;
    my $product = Bugzilla::Product::check_product( $e->field('tr:product') );
    if ( !Testopia::Build::check_build( $e->field('tr:name'), $product ) ) {
        Bugzilla::Extension::Testopia::Build->create(
            {
                product_id => $product->id,
                name       => $e->field('tr:name'),
            }
        );
    }
    return 1;
}

sub _check_environment {
    my ( $twig, $e ) = @_;
    print "Checking environments...\n" if $debug;
    my $product = Bugzilla::Product::check_product( $e->field('tr:product') );
    if ( !Testopia::Environment::check_environment( $e->field('tr:name'), $product ) ) {
        Bugzilla::Extension::Testopia::Environment->create(
            {
                product_id => $product->id,
                name       => $e->field('tr:name'),
            }
        );
    }
    return 1;
}

sub _check_milestone {
    my ( $twig, $e ) = @_;
    print "Checking milestones...\n" if $debug;
    my $product = Bugzilla::Product::check_product( $e->parent->field('tr:product') );
    Bugzilla::Milestone->check( { product => $product, name => $e->parent->field('tr:milestone') } );
    return 1;
}

sub process_caserun {
    my ( $twig, $e ) = @_;
    my $params;
    $params->{iscurrent}          = $e->field('tr:iscurrent') eq 'true' ? 1 : 0;
    $params->{case_id}            = $e->first_child('tr:case')->{'att'}->{'id'};
    $params->{run_id}             = $e->first_child('tr:run')->{'att'}->{'id'};
    $params->{build_id}           = $e->first_child('tr:build')->field('tr:name');
    $params->{environment_id}     = $e->first_child('tr:environment')->field('tr:name');
    $params->{case_run_status_id} = $e->field('tr:status');
    $params->{assignee}           = $e->first_child('tr:assignee')->field('tr:login') if $e->first_child('tr:assignee');
    $params->{testedby}           = $e->first_child('tr:testedby')->field('tr:login') if $e->first_child('tr:testedby');
    $params->{case_text_version}  = $e->field('tr:case_text_version');
    $params->{priority_id}        = $e->field('tr:priority');
    $params->{notes}              = $e->field('tr:notes');
    $params->{sortkey}            = $e->field('tr:sortkey');
    $params->{running_date}       = $e->field('tr:running_date') || undef;
    $params->{close_date}         = $e->field('tr:close_date') || undef;
    
    Bugzilla::Extension::Testopia::TestCaseRun->run_import_validators($params);

    push @caseruns, $params;
    return 1;

}

sub process_attachment {
    my ( $twig, $e ) = @_;
    my $params;
    $params->{submitter_id} = $e->first_child('tr:submitter')->field('tr:login') || Bugzilla->user->id;
    $params->{description}  = $e->field('tr:description');
    $params->{filename}     = $e->field('tr:filename');
    $params->{mime_type}    = $e->field('tr:mime_type');
    if ( defined $e->first_child('tr:contents') ) {
        my $encoding = $e->first_child('tr:contents')->{'att'}->{'encoding'};
        if ( $encoding && $encoding =~ /base64/ ) {
            $params->{contents} = decode_base64( $e->field('tr:contents') );
        }
        else {
            $params->{contents} = $e->field('tr:contents');
        }
    }
    Bugzilla::Extension::Testopia::Attachment->run_create_validators($params);
    push @attachments, $params;
    return 1;
}

sub process_case {
    my ( $twig, $e ) = @_;

    my $params = {};
    my @plans;
    my @comps;
    my @att;
    my @tags = $e->children_text('tr:tag');
    foreach my $comp ( $e->children('tr:component') ) {
        push @comps,
          {
            product   => $comp->field('tr:product'),
            component => $comp->field('tr:name'),
          };
    }
    push @plans, split( ',', $e->field('tr:linked_plans') );
    push @att, $_ foreach (@attachments);

    @attachments = ();

    $params->{'alias'}             = $e->field('tr:alias');
    $params->{'case_status_id'}    = $e->field('tr:case_status');
    $params->{'category_id'}       = $e->first_child('tr:category')->field('tr:name');
    $params->{'priority_id'}       = $e->field('tr:priority');
    $params->{'isautomated'}       = $e->field('tr:isautomated') eq 'true' ? 1 : 0;
    $params->{'estimated_time'}    = $e->field('tr:estimated_time');
    $params->{'script'}            = $e->field('tr:script');
    $params->{'arguments'}         = $e->field('tr:arguments');
    $params->{'summary'}           = $e->field('tr:summary');
    $params->{'requirement'}       = $e->field('tr:requirement');
    $params->{'author_id'}         = $e->first_child('tr:author')->field('tr:login') || Bugzilla->user->id;
    $params->{'action'}            = $e->first_child('tr:text')->field('tr:action');
    $params->{'effect'}            = $e->first_child('tr:text')->field('tr:expected_result');
    $params->{'setup'}             = $e->first_child('tr:text')->field('tr:setup');
    $params->{'breakdown'}         = $e->first_child('tr:text')->field('tr:breakdown');
    $params->{'dependson'}         = $e->field('tr:dependson');
    $params->{'blocks'}            = $e->field('tr:blocks');
    $params->{'tags'}              = \@tags;
    $params->{'bugs'}              = $e->field('tr:bugs');
    $params->{'plans'}             = \@plans;
    $params->{'components'}        = \@comps;
    $params->{'default_tester_id'} = $e->first_child('tr:default_tester')->field('tr:login') if $e->first_child('tr:default_tester');

    $params->{'attachments'} = \@att;
    $params->{'xid'}         = $e->{'att'}->{'id'};

    $xref->{cases}->{ $e->{'att'}->{'id'} } = undef;

    Bugzilla::Extension::Testopia::TestCase->run_import_validators($params);

    push @cases, $params;
    return 1;
}

sub process_run {
    my ( $twig, $e ) = @_;
    my $params = {};
    my @crs;

    push @crs, $_ foreach (@caseruns);

    @caseruns = ();

    $params->{'summary'}           = $e->field('tr:summary');
    $params->{'plan_id'}           = $e->first_child('tr:plan')->{'att'}->{'id'};
    $params->{'plan_text_version'} = $e->field('tr:plan_text_version');
    $params->{'product_version'}   = $e->field('tr:product_version');
    $params->{'build_id'}          = $e->first_child('tr:build')->field('tr:name');
    $params->{'environment_id'}    = $e->first_child('tr:environment')->field('tr:name');
    $params->{'manager_id'}        = $e->first_child('tr:manager')->field('tr:login') || Bugzilla->user->id;
    $params->{'start_date'}        = $e->field('tr:start_date') || undef;
    $params->{'stop_date'}         = $e->field('tr:stop_date') || undef;
    $params->{'plan_text_version'} = $e->field('tr:plan_text_version');
    $params->{'notes'}             = $e->field('tr:notes');
    $params->{'target_pass'}       = $e->field('tr:target_pass_rate');
    $params->{'target_completion'} = $e->field('tr:target_completion_rate');

    $params->{'caseruns'}          = \@crs;
    $params->{'xid'}               = $e->{'att'}->{'id'};
    
    $xref->{runs}->{ $e->{'att'}->{'id'} } = undef;
    
    Bugzilla::Extension::Testopia::TestRun->run_import_validators($params);
    
    push @runs, $params;
    return 1;
}

sub process_plan {
    my ( $twig, $e ) = @_;
    my $params = {};
    my @att;
    my @tags = $e->children_text('tr:tag');
    push @att, $_ foreach (@attachments);
    @attachments = ();

    $params->{'product_id'}              = $e->field('tr:product');
    $params->{'author_id'}               = $e->first_child('tr:author')->field('tr:login') || Bugzilla->user->id;
    $params->{'type_id'}                 = $e->field('tr:plan_type');
    $params->{'name'}                    = $e->field('tr:name');
    $params->{'text'}                    = $e->first_child('tr:document')->field('tr:text');
    $params->{'tags'}                    = \@tags;
    $params->{'default_product_version'} = $e->field('tr:default_product_version');

    $params->{'attachments'} = \@att;
    $params->{'xid'}         = $e->{'att'}->{'id'};

    $xref->{plans}->{ $e->{'att'}->{'id'} } = undef;

    Bugzilla::Extension::Testopia::TestPlan->run_create_validators($params);

    push @plans, $params;
    return 1;
}

sub parse {
    my ( $self, $xml, $product, $plans ) = @_;
    $debug = $self->debug;
    my $validator = XML::Validator::Schema->new( file => 'extensions/Testopia/testopia.xsd' );
    my $parser = XML::SAX::ParserFactory->parser( Handler => $validator );

    my $twig = XML::Twig->new(
        keep_encoding => 1,
        twig_handlers => {
            'tr:category'    => \&_check_category,
            'tr:build'       => \&_check_build,
            'tr:milestone'   => \&_check_milestone,
            'tr:environment' => \&_check_environment,
            'tr:testcase'    => \&process_case,
            'tr:testplan'    => \&process_plan,
            'tr:testcaserun' => \&process_caserun,
            'tr:testrun'     => \&process_run,
            'tr:attachment'  => \&process_attachment,
        },
    );

    # Check if we have a file
    if ( -e $xml ) {
        eval{
            $parser->parse_file($xml);
            $twig->parsefile($xml);            
        };
        if ($@){
            print STDERR $@;
            ThrowUserError('import_parse_error', {type => 'XML', msg => $@})
        }
    }
    elsif ( $xml =~ /^<\?xml/ ) {
        eval{
            $parser->parse_string($xml);
            $twig->parse($xml);            
        };
        if ($@){
            print STDERR $@;
            ThrowUserError('import_parse_error', {type => 'XML', msg => $@})
        }
    }
    else {
        ThrowUserError('invlid-import-source');
    }

    ###
    # Start by importing any Test Plans
    # We will assume that if a product was passed to parse that we should use
    # that product instead of whatever was included in the plan.
    ###
    foreach my $params (@plans) {
        $params->{product_id} = $product if $product;

        my $attachments = $params->{attachments};
        my $xid         = $params->{xid};

        delete $params->{xid};
        delete $params->{attachments};

        my $plan = Bugzilla::Extension::Testopia::TestPlan->create($params);
        foreach my $a (@$attachments) {
            $a->{'plan_id'} = $plan->id;
            Bugzilla::Extension::Testopia::Attachment->create($a);
        }

        $xref->{plans}->{$xid} = $plan->id;
        $params->{xid} = $plan->id;
    }

    my @caseplans;
    if ($plans) {
        push @caseplans, new Bugzilla::Extension::Testopia::TestPlan($_) foreach split( ',', $plans );
    }

    foreach my $params (@cases) {
        if ($plans) {
            $params->{plans} = \@caseplans;
        }
        else {
            my @linkedplans;
            foreach my $pid ( @{ $params->{plans} } ) {
                if ( $xref->{plans}->{$pid} ) {
                    push @linkedplans, new Bugzilla::Extension::Testopia::TestPlan( $xref->{plans}->{$pid} );
                }
            }
            ThrowUserError('plan_needed') unless scalar @linkedplans;
            $params->{plans} = \@linkedplans;
        }

        my $attachments = $params->{attachments};
        my $xid         = $params->{xid};

        delete $params->{xid};
        delete $params->{attachments};
        
        my $case = Bugzilla::Extension::Testopia::TestCase->create($params);
        foreach my $a (@$attachments) {
            $a->{'case_id'} = $case->id;
            Bugzilla::Extension::Testopia::Attachment->create($a);
        }

        $xref->{cases}->{$xid} = $case->id;
        $params->{xid} = $case->id;

    }
    foreach my $params (@cases) {
        my @blocks;
        my @dependson;
        foreach my $tb ( split( /[\s,]+/, $params->{blocks} ) ) {
            push @blocks, $xref->{cases}->{$tb} if $xref->{cases}->{$tb};
        }
        foreach my $tb ( split( /[\s,]+/, $params->{dependson} ) ) {
            push @dependson, $xref->{cases}->{$tb} if $xref->{cases}->{$tb};
        }
        my $case = Bugzilla::Extension::Testopia::TestCase->new( $params->{xid} );
        $case->set_blocks( join( ',', @blocks ) );
        $case->set_dependson( join( ',', @dependson ) );
        $case->update();

    }
    
    foreach my $params (@runs) {
        my $caseruns = $params->{caseruns};
        my $xid      = $params->{xid};
        
        $params->{'start_date'} =~ s/T/ / if $params->{'start_date'};
        $params->{'stop_date'}  =~ s/T/ / if $params->{'stop_date'};
        $params->{'status'}     = $params->{'stop_date'} ? 0 : 1;

        delete $params->{xid};
        delete $params->{caseruns};
        
        $params->{plan_id} = $xref->{plans}->{$params->{plan_id}};

        my $run = Bugzilla::Extension::Testopia::TestRun->create($params);
        foreach my $c (@$caseruns) {
            
            if ($xref->{cases}->{$c->{case_id}}){
                $c->{running_date} =~ s/T/ / if $c->{running_date};
                $c->{close_date} =~ s/T/ / if $c->{close_date};
                $c->{case_id} = $xref->{cases}->{$c->{case_id}};
                $c->{run_id} = $run->id;
                
                Bugzilla::Extension::Testopia::TestCaseRun->create($c);
            }
        }

        $xref->{runs}->{$xid} = $run->id;
        $params->{xid} = $run->id;
    }

    print Data::Dumper::Dumper($xref) if $debug;
    my @newcases = values %{$xref->{cases}}; 
    return \@newcases;

}

1;

__END__

=head1 NAME

Bugzilla::Extension::Testopia::Importer

=head1 DESCRIPTION

Importer is responsible for importing test plans, cases, and runs from XML.  

=head1 SEE ALSO

See tr_importxml.pl for usage.
See testopia.xsd for format

