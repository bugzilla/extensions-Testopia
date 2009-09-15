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

package Testopia::Importer;

use strict;

use Class::Struct;
use Data::Dumper;
use Testopia::Attachment;
use Testopia::TestPlan;
use Testopia::TestCase;
use Testopia::Category;
use MIME::Base64;
use XML::Validator::Schema;

local our @attachments;
local our @cases;
local our @plans;
local our @runs;
local our $xref = { 'cases' => {}, 'plans' => {} };

struct( 'Testopia::Importer', {} );

sub _check_category {
    my ( $twig, $e ) = @_;
    print "Checking categories...\n";
    my $product = Bugzilla::Product::check_product( $e->field('tr:product') );
    if ( !Testopia::Category::check_case_category( $e->field('tr:name'), $product ) ) {
        Testopia::Category->create(
            {
                product_id => $product->id,
                name       => $e->field('tr:name'),
            }
        );
    }
}

sub _check_build {
    my ( $twig, $e ) = @_;
    print "Checking builds...\n";
    my $product = Bugzilla::Product::check_product( $e->field('tr:product') );
    if ( !Testopia::Build::check_build( $e->field('tr:name'), $product ) ) {
        Testopia::Build->create(
            {
                product_id => $product->id,
                name       => $e->field('tr:name'),
            }
        );
    }
}

sub _check_environment {
    my ( $twig, $e ) = @_;
    print "Checking environments...\n";
    my $product = Bugzilla::Product::check_product( $e->field('tr:product') );
    if ( !Testopia::Environment::check_environment( $e->field('tr:name'), $product ) ) {
        Testopia::Environment->create(
            {
                product_id => $product->id,
                name       => $e->field('tr:name'),
            }
        );
    }
}

sub _check_milestone {
    my ( $twig, $e ) = @_;
    print "Checking milestones...\n";
    my $product = Bugzilla::Product::check_product( $e->parent->field('tr:product') );
    Bugzilla::Milestone->check( { product => $product, name => $e->parent->field('tr:milestone') } );
}

sub process_attachment {
    my ( $twig, $a ) = @_;
    my $params;
    $params->{submitter_id} = $a->first_child('tr:submitter')->field('tr:login') || Bugzilla->user->id;
    $params->{description}  = $a->field('tr:description');
    $params->{filename}     = $a->field('tr:filename');
    $params->{mime_type}    = $a->field('tr:mime_type');
    if ( defined $a->first_child('tr:contents') ) {
        my $encoding = $a->first_child('tr:contents')->{'att'}->{'encoding'};
        if ( $encoding && $encoding =~ /base64/ ) {
            $params->{contents} = decode_base64( $a->field('tr:contents') );
        }
        else {
            $params->{contents} = $a->field('tr:contents');
        }
    }
    Testopia::Attachment->run_create_validators($params);
    push @attachments, $params;
}

sub process_case {
    my ( $twig, $c ) = @_;

    my $params = {};
    my @plans;
    my @comps;
    my @att;
    my @tags = $c->children_text('tr:tag');
    foreach my $comp ( $c->children('tr:component') ) {
        push @comps,
          {
            product   => $comp->field('tr:product'),
            component => $comp->field('tr:name'),
          };
    }
    push @plans, split( ',', $c->field('tr:linked_plans') );
    push @att, $_ foreach (@attachments);

    @attachments = ();

    $params->{'alias'}          = $c->field('tr:alias')       || '';
    $params->{'case_status_id'} = $c->field('tr:case_status') || '';
    $params->{'category_id'}    = $c->first_child('tr:category')->field('tr:name')    || '';
    $params->{'priority_id'}    = $c->field('tr:priority')    || '';
    $params->{'isautomated'} = $c->field('tr:isautomated') eq 'true' ? 1 : 0;
    $params->{'estimated_time'} = $c->field('tr:estimated_time') || '';
    $params->{'script'}         = $c->field('tr:script')         || '';
    $params->{'arguments'}      = $c->field('tr:arguments')      || '';
    $params->{'summary'}        = $c->field('tr:summary')        || '';
    $params->{'requirement'}    = $c->field('tr:requirement')    || '';
    $params->{'author_id'} = $c->first_child('tr:author')->field('tr:login')         || Bugzilla->user->id || '';
    $params->{'action'}    = $c->first_child('tr:text')->field('tr:action')          || '';
    $params->{'effect'}    = $c->first_child('tr:text')->field('tr:expected_result') || '';
    $params->{'setup'}     = $c->first_child('tr:text')->field('tr:setup')           || '';
    $params->{'breakdown'} = $c->first_child('tr:text')->field('tr:breakdown')       || '';
    $params->{'dependson'} = $c->field('tr:dependson')                               || '';
    $params->{'blocks'}    = $c->field('tr:blocks')                                  || '';
    $params->{'tags'}      = \@tags;
    $params->{'bugs'}      = $c->field('tr:bugs')                                    || '';
    $params->{'plans'}     = \@plans;
    $params->{'components'} = \@comps;
    $params->{'default_tester_id'} = $c->first_child('tr:default_tester')->field('tr:login') || '';

    $params->{'attachments'} = \@att;
    $params->{'xid'}         = $c->{'att'}->{'id'};

    $xref->{cases}->{ $c->{'att'}->{'id'} } = undef;
    
    Testopia::TestCase->run_import_validators($params);
    
    push @cases, $params;
}

sub process_plan {
    my ( $twig, $p ) = @_;
    my $params = {};
    my @att;
    my @tags = $p->children_text('tr:tag');
    push @att, $_ foreach (@attachments);
    @attachments = ();

    $params->{'product_id'}              = $p->field('tr:product');
    $params->{'author_id'}               = $p->first_child('tr:author')->field('tr:login') || Bugzilla->user->id || '';
    $params->{'type_id'}                 = $p->field('tr:plan_type');
    $params->{'name'}                    = $p->field('tr:name');
    $params->{'text'}                    = $p->first_child('tr:document')->field('tr:text') || '';
    $params->{'tags'}                    = \@tags;
    $params->{'default_product_version'} = $p->field('tr:default_product_version');

    $params->{'attachments'} = \@att;
    $params->{'xid'}         = $p->{'att'}->{'id'};

    $xref->{plans}->{ $p->{'att'}->{'id'} } = undef;
    
    Testopia::TestPlan->run_create_validators($params);

    push @plans, $params;
}

sub parse {
    my ( $self, $xml, $product, $plans ) = @_;
    my $validator = XML::Validator::Schema->new( file => 'extensions/testopia/testopia.xsd' );
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
            'tr:attachment'  => \&process_attachment
        },
    );

    # Check if we have a file
    if ( -e $xml ) {
        $parser->parse_file($xml);
        $twig->parsefile($xml);
    }
    elsif ( $xml =~ /^<\?xml/ ) {
        $parser->pase_string($xml);
        $twig->parse($xml);
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

        my $plan = Testopia::TestPlan->create($params);
        foreach my $a (@$attachments) {
            $a->{'plan_id'} = $plan->id;
            Testopia::Attachment->create($a);
        }

        $xref->{plans}->{$xid} = $plan->id;
        $params->{xid} = $plan->id;
    }

    my @caseplans;
    if ($plans) {
        push @caseplans, new Testopia::TestPlan($_) foreach split( ',', $plans );
    }

    foreach my $params (@cases) {
        if ($plans) {
            $params->{plans} = \@caseplans;
        }
        else {
            my @linkedplans;
            foreach my $pid ( @{ $params->{plans} } ) {
                if ( $xref->{plans}->{$pid} ) {
                    push @linkedplans, new Testopia::TestPlan( $xref->{plans}->{$pid} );
                }
            }
            ThrowUserError('plan_needed') unless scalar @linkedplans;
            $params->{plans} = \@linkedplans;
        }
        
        my $attachments = $params->{attachments};
        my $xid         = $params->{xid};

        delete $params->{xid};
        delete $params->{attachments};

        my $case = Testopia::TestCase->create($params);
        foreach my $a (@$attachments) {
            $a->{'case_id'} = $case->id;
            Testopia::Attachment->create($a);
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
        my $case = Testopia::TestCase->new( $params->{xid} );
        $case->set_blocks( join( ',', @blocks ) );
        $case->set_dependson( join( ',', @dependson ) );
        $case->update();

    }

    print Data::Dumper::Dumper($xref);

}

1;
