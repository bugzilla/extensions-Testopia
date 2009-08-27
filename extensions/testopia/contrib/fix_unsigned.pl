#!/usr/bin/perl -w
print "Starting...\n";
use strict;

use lib qw(. lib ../../..);

use Bugzilla;
use Bugzilla::Constants;
use Bugzilla::Error;
use Bugzilla::Util;
use Data::Dumper;

my $dbh = Bugzilla->dbh;
my $dropped_fks = 0;

if ($dbh->isa('Bugzilla::DB::Mysql')){
    print "Found Mysql\n";
    
    my $schema = $dbh->_bz_real_schema;

    foreach my $table ($schema->get_table_list()) {
        my $sth = $dbh->column_info(undef, undef, $table, '%');
        my $col_data;
        while ($col_data = $sth->fetchrow_hashref) {
            my $name = $col_data->{COLUMN_NAME};
            if ($col_data->{mysql_type_name} =~ /unsigned/){
                print "FOUND UNSIGNED!!! \n" unless $dropped_fks;
                drop_all_foreign_keys() if $dropped_fks == 0;
                $dropped_fks = 1;
                my $type = $col_data->{mysql_type_name};
                my $autoinc = $col_data->{mysql_is_auto_increment} ? 'AUTO_INCREMENT' : '';
                my $notnull = $col_data->{IS_NULLABLE} eq 'NO' ? 'NOT NULL' : '';
                $type =~ s/ unsigned//;
                
                eval{
                    print("ALTER TABLE $table MODIFY COLUMN $name $type $notnull $autoinc \n");
                    $dbh->do("ALTER TABLE $table MODIFY COLUMN $name $type $notnull $autoinc");
                };
                if ($@){
                    print $@;
                }
            }
        }
    }
    if ($dropped_fks){
        print <<MESSAGE;
        
    #################################################################
     IMPORTANT: Foreign keys were dropped. Please run checksetup.pl 
    #################################################################
        
MESSAGE

    }
    else {
        print "No UNSIGNED fields found... Exiting. \n";
        exit;
    }
}
else {
    print "This script only supports MySQL databases... Exiting. \n";
    exit;
}

sub drop_all_foreign_keys {
    print <<END;

    WARNING:
    This action will drop all foreign keys in the database 
    so that it can alter the fields and remove the UNSIGNED 
    attribute. Running checksetup.pl afterwards will recreate
    the foreign keys.
    
    This may take a long time and should probably be done while 
    Bugzilla is offline. Do you wish to continue? (YES/no)
    
END
    my $response = <STDIN>;
    die "Exiting... \n" if $response !~ /y/i;
    
    my $dbh = Bugzilla->dbh;
    my @tables = $dbh->_bz_schema->get_table_list();
    foreach my $table (@tables) {
        my @columns = $dbh->_bz_schema->get_table_columns($table);
        foreach my $column (@columns) {
            my $def = $dbh->_bz_schema->get_column_abstract($table, $column);
            if ($def->{REFERENCES}) {
                print "DROPPING FK: $table -> $column \n";
                eval {$dbh->bz_drop_fk($table, $column);};
                if ($@){
                    print $@;
                }
            }
        }
    }
}