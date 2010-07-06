package Bugzilla::Extension::Testopia;
use strict;
use constant NAME => 'Testopia';

use constant REQUIRED_MODULES => [
    {
        package => 'JSON',
        module  => 'JSON',
        version => '2.10'
    },
    {
        package => 'Text-Diff',
        module  => 'Text::Diff',
        version => '0.35'
    },
    {
        package => 'GD-Graph3d',
        module  => 'GD::Graph3d',
        version => '0.63'
    },
];

use constant OPTIONAL_MODULES => [
    {
        package => 'Text-CSV',
        module  => 'Text::CSV',
        version => '1.06',
        feature => ['CSV Importing of test cases']
    },
    {
        package => 'XML Schema Validator',
        module  => 'XML::Validator::Schema',
        version => '1.10',
        feature => ['XML Importing of test cases and plans']
    },
    {
        package => 'XML Schema Parser',
        module  => 'XML::SAX::ParserFactory',
        version => 0,
        feature => ['XML Importing of test cases and plans']
    },
    {
        package => 'XML Twig',
        module  => 'XML::Twig',
        version => 0,
        feature => ['XML Importing of test cases and plans']
    }
];    

__PACKAGE__->NAME;
