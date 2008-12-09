#!/usr/bin/perl -w

use strict;
use Bugzilla::Testopia::Product;

my $vars = Bugzilla->hook_args->{vars};

$vars->{'testopia_product'} = new Bugzilla::Testopia::Product($vars->{product}->id);\ No newline at end of file
