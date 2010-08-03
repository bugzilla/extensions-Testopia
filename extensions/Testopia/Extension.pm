package Bugzilla::Extension::Testopia;
use strict;
use base qw(Bugzilla::Extension);

use Bugzilla::Extension::Testopia::Product;
use Bugzilla::Extension::Testopia::TestCase;
use Bugzilla::Extension::Testopia::TestPlan;
use Bugzilla::Extension::Testopia::TestRun;
use Bugzilla::Group;
use Bugzilla::Status;
use Bugzilla::User::Setting;
use Bugzilla::Util;
use File::Path;

our $VERSION = '2.3.1';

sub bug_end_of_update {
    my ($self, $args) = @_;
    
    
    
    my $bug = $args->{'bug'};
    my $timestamp = $args->{'timestamp'};
    my $changes = $args->{'changes'};
    my $dbh = Bugzilla->dbh;
    
    foreach my $field (keys %$changes) {
        my $used_to_be = $changes->{$field}->[0];
        my $now_it_is  = $changes->{$field}->[1];
    }
    
    my $tcrs = $dbh->selectcol_arrayref("SELECT case_id FROM test_case_bugs WHERE bug_id = ?", undef, $bug->id);
    
    my $status_message;
    if (my $status_change = $changes->{'bug_status'}) {
        my $old_status = new Bugzilla::Status({ name => $status_change->[0] });
        my $new_status = new Bugzilla::Status({ name => $status_change->[1] });
        if ($new_status->is_open && !$old_status->is_open) {
            for my $tcr(@$tcrs) {
                my $tc = Bugzilla::Extension::Testopia::TestCase->new($tcr);
                $tc->remove_tag('BUGFIXED');
            }
        }
        if (!$new_status->is_open && $old_status->is_open) {
            for my $tcr(@$tcrs) {
                my $tc = Bugzilla::Extension::Testopia::TestCase->new($tcr);
                $tc->add_tag('BUGFIXED');
            }        
        }
    }
}

sub buglist_columns {
    my ($self, $args) = @_;
    
    
    my $columns = $args->{'columns'};
    $columns->{'test_cases'} = { 'name' => 'tcb.case_id' , 'title' => 'Test Cases' };
}

sub colchange_columns {
    my ($self, $args) = @_;
    
    
    
    my $columns = $args->{'columns'};
    push (@$columns, "test_cases")
}

sub config_add_panels {
    my ($self, $args) = @_;
    
    my $modules = $args->{panel_modules};
    $modules->{Testopia} = "Bugzilla::Extension::Testopia::Config";
}

sub db_schema_abstract_schema {
    my ($self, $args) = @_;
    
    my $schema = $args->{schema};
    
    $schema->{test_attachments} = {
        FIELDS => [
            attachment_id => { TYPE => 'INTSERIAL', PRIMARYKEY => 1, NOTNULL => 1 },
            submitter_id  => {
                TYPE       => 'INT3',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'profiles',
                    COLUMN => 'userid'
                }
            },
            description => { TYPE => 'MEDIUMTEXT' },
            filename    => { TYPE => 'MEDIUMTEXT' },
            creation_ts => { TYPE => 'DATETIME', NOTNULL => 1 },
            mime_type   => { TYPE => 'varchar(100)', NOTNULL => 1 },
        ],
        INDEXES => [ test_attachments_submitter_idx => ['submitter_id'], ],
      },
      $schema->{test_case_attachments} = {
        FIELDS => [
            attachment_id => {
                TYPE       => 'INT4',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_attachments',
                    COLUMN => 'attachment_id',
                    DELETE => 'CASCADE'
                }
            },
            case_id => {
                TYPE       => 'INT4',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_cases',
                    COLUMN => 'case_id',
                    DELETE => 'CASCADE'
                }
            },
            case_run_id => {
                TYPE       => 'INT4',
                REFERENCES => {
                    TABLE  => 'test_case_runs',
                    COLUMN => 'case_run_id',
                    DELETE => 'CASCADE'
                  }
    
            },
        ],
        INDEXES => [
            test_case_attachments_primary_idx => ['attachment_id'],
            attachment_case_id_idx            => ['case_id'],
            attachment_caserun_id_idx         => ['case_run_id'],
        ],
      },
      $schema->{test_plan_attachments} = {
        FIELDS => [
            attachment_id => {
                TYPE       => 'INT4',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_attachments',
                    COLUMN => 'attachment_id',
                    DELETE => 'CASCADE'
                }
            },
            plan_id => {
                TYPE       => 'INT4',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_plans',
                    COLUMN => 'plan_id',
                    DELETE => 'CASCADE'
                }
            },
        ],
        INDEXES => [
            test_plan_attachments_primary_idx => ['attachment_id'],
            attachment_plan_id_idx            => ['plan_id'],
        ],
      },
      $schema->{test_case_categories} = {
        FIELDS => [
            category_id => { TYPE => 'SMALLSERIAL', PRIMARYKEY => 1, NOTNULL => 1 },
            product_id  => {
                TYPE       => 'INT2',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'products',
                    COLUMN => 'id',
                    DELETE => 'CASCADE'
                }
            },
            name        => { TYPE => 'varchar(240)', NOTNULL => 1 },
            description => { TYPE => 'MEDIUMTEXT' },
        ],
        INDEXES => [
            category_product_id_name_idx => { FIELDS => [qw(product_id name)],        TYPE => 'UNIQUE' },
            category_product_idx         => { FIELDS => [qw(category_id product_id)], TYPE => 'UNIQUE' },
            category_name_idx_v2         => ['name'],
        ],
      },
      $schema->{test_cases} = {
        FIELDS => [
            case_id        => { TYPE => 'INTSERIAL', PRIMARYKEY => 1, NOTNULL => 1 },
            case_status_id => {
                TYPE       => 'INT2',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_case_status',
                    COLUMN => 'case_status_id',
                    DELETE => 'CASCADE'
                }
            },
            category_id => {
                TYPE       => 'INT2',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_case_categories',
                    COLUMN => 'category_id',
                    DELETE => 'CASCADE'
                }
            },
            priority_id => {
                TYPE       => 'INT2',
                REFERENCES => {
                    TABLE  => 'priority',
                    COLUMN => 'id',
                    DELETE => 'RESTRICT'
                }
            },
            author_id => {
                TYPE       => 'INT3',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'profiles',
                    COLUMN => 'userid',
                }
            },
            default_tester_id => {
                TYPE       => 'INT3',
            },
            creation_date  => { TYPE => 'DATETIME', NOTNULL => 1 },
            estimated_time => { TYPE => 'TIME' },
            isautomated => { TYPE => 'BOOLEAN', NOTNULL => 1, DEFAULT => '0' },
            sortkey     => { TYPE => 'INT4' },
            script      => { TYPE => 'MEDIUMTEXT' },
            arguments   => { TYPE => 'MEDIUMTEXT' },
            summary     => { TYPE => 'varchar(255)' },
            requirement => { TYPE => 'varchar(255)' },
            alias       => { TYPE => 'varchar(255)' },
        ],
        INDEXES => [
            test_case_category_idx      => ['category_id'],
            test_case_author_idx        => ['author_id'],
            test_case_creation_date_idx => ['creation_date'],
            test_case_sortkey_idx       => ['sortkey'],
            test_case_shortname_idx     => ['alias'],
            test_case_requirement_idx   => ['requirement'],
            test_case_status_idx        => ['case_status_id'],
            test_case_tester_idx        => ['default_tester_id'],
        ],
      },
      $schema->{test_case_bugs} = {
        FIELDS => [
            bug_id => {
                TYPE       => 'INT3',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'bugs',
                    COLUMN => 'bug_id',
                    DELETE => 'CASCADE'
                }
            },
            case_run_id => {
                TYPE       => 'INT4',
                REFERENCES => {
                    TABLE  => 'test_case_runs',
                    COLUMN => 'case_run_id',
                    DELETE => 'CASCADE'
                }
            },
            case_id => {
                TYPE       => 'INT4',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_cases',
                    COLUMN => 'case_id',
                    DELETE => 'CASCADE'
                }
            },
        ],
        INDEXES => [
            case_bugs_bug_id_idx      => ['bug_id'],
            case_bugs_case_id_idx     => ['case_id'],
            case_bugs_case_run_id_idx => ['case_run_id'],
        ],
      },
      $schema->{test_case_runs} = {
        FIELDS => [
            case_run_id => { TYPE => 'INTSERIAL', PRIMARYKEY => 1, NOTNULL => 1 },
            run_id      => {
                TYPE       => 'INT4',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_runs',
                    COLUMN => 'run_id',
                    DELETE => 'CASCADE'
                }
            },
            case_id => {
                TYPE       => 'INT4',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_cases',
                    COLUMN => 'case_id',
                    DELETE => 'CASCADE'
                }
            },
            assignee => {
                TYPE       => 'INT3'
            },
            testedby => {
                TYPE       => 'INT3'
            },
            case_run_status_id => {
                TYPE       => 'INT2',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_case_run_status',
                    COLUMN => 'case_run_status_id',
                    DELETE => 'CASCADE'
                }
            },
            case_text_version => { TYPE => 'INT3', NOTNULL => 1 },
            build_id          => {
                TYPE       => 'INT4',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_builds',
                    COLUMN => 'build_id',
                    DELETE => 'CASCADE'
                }
            },
            running_date => { TYPE => 'DATETIME' },
            close_date   => { TYPE => 'DATETIME' },
            notes        => { TYPE => 'TEXT' },
            iscurrent    => { TYPE => 'BOOLEAN', NOTNULL => 1, DEFAULT => '0' },
            sortkey      => { TYPE => 'INT4' },
            environment_id => {
                TYPE       => 'INT4',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_environments',
                    COLUMN => 'environment_id',
                    DELETE => 'CASCADE'
                }
            },
            priority_id => {
                TYPE       => 'INT2',
                REFERENCES => {
                    TABLE  => 'priority',
                    COLUMN => 'id',
                    DELETE => 'RESTRICT'
                }
            },
            
        ],
        INDEXES => [
            case_run_case_id_idx    => ['case_id'],
            case_run_assignee_idx   => ['assignee'],
            case_run_testedby_idx   => ['testedby'],
            case_run_close_date_idx => ['close_date'],
            case_run_build_env_idx  => {
                FIELDS => [qw(run_id case_id build_id environment_id)],
                TYPE   => 'UNIQUE'
            },
            case_run_status_idx   => ['case_run_status_id'],
            case_run_text_ver_idx => ['case_text_version'],
            case_run_build_idx_v2 => ['build_id'],
            case_run_env_idx_v2   => ['environment_id'],
            case_run_priority_idx => ['priority_id'],
        ],
      },
      $schema->{test_case_texts} = {
        FIELDS => [
            case_id => {
                TYPE       => 'INT4',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_cases',
                    COLUMN => 'case_id',
                    DELETE => 'CASCADE'
                }
            },
            case_text_version => { TYPE => 'INT3', NOTNULL => 1 },
            who               => {
                TYPE       => 'INT3',
                NOTNULL    => 1,
            },
            creation_ts => { TYPE => 'DATETIME', NOTNULL => 1 },
            action      => { TYPE => 'MEDIUMTEXT' },
            effect      => { TYPE => 'MEDIUMTEXT' },
            setup       => { TYPE => 'MEDIUMTEXT' },
            breakdown   => { TYPE => 'MEDIUMTEXT' },
        ],
        INDEXES => [
            case_versions_idx => {
                FIELDS => [qw(case_id case_text_version)],
                TYPE   => 'UNIQUE'
            },
            case_versions_who_idx         => ['who'],
            case_versions_creation_ts_idx => ['creation_ts'],
        ],
      },
      $schema->{test_tags} = {
        FIELDS => [
            tag_id   => { TYPE => 'INTSERIAL',    PRIMARYKEY => 1, NOTNULL => 1 },
            tag_name => { TYPE => 'varchar(255)', NOTNULL    => 1 },
        ],
        INDEXES => [ test_tag_name_idx_v2 => [qw(tag_name)] ],
      },
      $schema->{test_case_tags} = {
        FIELDS => [
            tag_id => {
                TYPE       => 'INT4',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_tags',
                    COLUMN => 'tag_id',
                    DELETE => 'CASCADE'
                }
            },
            case_id => {
                TYPE       => 'INT4',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_cases',
                    COLUMN => 'case_id',
                    DELETE => 'CASCADE'
                }
            },
            userid => {
                TYPE       => 'INT3',
                NOTNULL    => 1,
            },
        ],
        INDEXES => [
            case_tags_primary_idx    => { FIELDS => [qw(tag_id case_id userid)], TYPE => 'UNIQUE' },
            case_tags_secondary_idx  => { FIELDS => [qw(tag_id case_id)],        TYPE => 'UNIQUE' },
            case_tags_case_id_idx_v3 => [qw(case_id)],
            case_tags_userid_idx     => [qw(userid)],
        ],
      },
      $schema->{test_run_tags} = {
        FIELDS => [
            tag_id => {
                TYPE       => 'INT4',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_tags',
                    COLUMN => 'tag_id',
                    DELETE => 'CASCADE'
                }
            },
            run_id => {
                TYPE       => 'INT4',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_runs',
                    COLUMN => 'run_id',
                    DELETE => 'CASCADE'
                  }
    
            },
            userid => {
                TYPE       => 'INT3',
                NOTNULL    => 1,
            },
        ],
        INDEXES => [
            run_tags_primary_idx   => { FIELDS => [qw(tag_id run_id userid)], TYPE => 'UNIQUE' },
            run_tags_secondary_idx => { FIELDS => [qw(tag_id run_id)],        TYPE => 'UNIQUE' },
            run_tags_run_id_idx    => [qw(run_id)],
            run_tags_userid_idx    => [qw(userid)],
        ],
      },
      $schema->{test_plan_tags} = {
        FIELDS => [
            tag_id => {
                TYPE       => 'INT4',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_tags',
                    COLUMN => 'tag_id',
                    DELETE => 'CASCADE'
                }
            },
            plan_id => {
                TYPE       => 'INT4',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_plans',
                    COLUMN => 'plan_id',
                    DELETE => 'CASCADE'
                }
            },
            userid => {
                TYPE       => 'INT3',
                NOTNULL    => 1,
            },
        ],
        INDEXES => [
            plan_tags_primary_idx   => { FIELDS => [qw(tag_id plan_id userid)], TYPE => 'UNIQUE' },
            plan_tags_secondary_idx => { FIELDS => [qw(tag_id plan_id)],        TYPE => 'UNIQUE' },
            plan_tags_plan_id_idx   => [qw(plan_id)],
            plan_tags_userid_idx    => [qw(userid)],
        ],
      },
      $schema->{test_plans} = {
        FIELDS => [
            plan_id    => { TYPE => 'INTSERIAL', PRIMARYKEY => 1, NOTNULL => 1 },
            product_id => {
                TYPE       => 'INT2',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'products',
                    COLUMN => 'id',
                    DELETE => 'CASCADE'
                  }
    
            },
            author_id => {
                TYPE       => 'INT3',
                NOTNULL    => 1,
            },
            type_id => {
                TYPE       => 'INT2',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_plan_types',
                    COLUMN => 'type_id',
                    DELETE => 'CASCADE'
                }
            },
            default_product_version => { TYPE => 'MEDIUMTEXT',   NOTNULL => 1 },
            name                    => { TYPE => 'varchar(255)', NOTNULL => 1 },
            creation_date           => { TYPE => 'DATETIME',     NOTNULL => 1 },
            isactive                => { TYPE => 'BOOLEAN',      NOTNULL => 1, DEFAULT => '1' },
        ],
        INDEXES => [
            plan_product_plan_id_idx => [qw(product_id plan_id)],
            plan_author_idx          => ['author_id'],
            plan_type_idx            => ['type_id'],
            plan_isactive_idx        => ['isactive'],
            plan_name_idx            => ['name'],
        ],
      },
      $schema->{test_plan_permissions} = {
        FIELDS => [
            userid => {
                TYPE       => 'INT3',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'profiles',
                    COLUMN => 'userid',
                    DELETE => 'CASCADE'
                  }
    
            },
            plan_id => {
                TYPE       => 'INT4',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_plans',
                    COLUMN => 'plan_id',
                    DELETE => 'CASCADE'
                  }
    
            },
            permissions => { TYPE => 'INT1', NOTNULL => 1 },
            grant_type  => { TYPE => 'INT1', NOTNULL => 1 },
        ],
        INDEXES => [
            testers_plan_user_idx      => { FIELDS => [qw(userid plan_id grant_type)], TYPE => 'UNIQUE' },
            testers_plan_user_plan_idx => ['plan_id'],
            testers_plan_grant_idx     => ['grant_type'],
        ],
      },
      $schema->{test_plan_permissions_regexp} = {
        FIELDS => [
            plan_id => {
                TYPE       => 'INT4',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_plans',
                    COLUMN => 'plan_id',
                    DELETE => 'CASCADE'
                }
            },
            user_regexp => { TYPE => 'TEXT', NOTNULL => 1 },
            permissions => { TYPE => 'INT1', NOTNULL => 1 },
        ],
        INDEXES => [ testers_plan_regexp_idx => { FIELDS => [qw(plan_id)], TYPE => 'UNIQUE' }, ],
      },
      $schema->{test_plan_texts} = {
        FIELDS => [
            plan_id => {
                TYPE       => 'INT4',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_plans',
                    COLUMN => 'plan_id',
                    DELETE => 'CASCADE'
                }
            },
            plan_text_version => { TYPE => 'INT4', NOTNULL => 1 },
            who               => {
                TYPE       => 'INT3',
                NOTNULL    => 1,
            },
            creation_ts => { TYPE => 'DATETIME', NOTNULL => 1 },
            plan_text   => { TYPE => 'MEDIUMTEXT' },
        ],
        INDEXES => [
            test_plan_text_version_idx => [qw(plan_id plan_text_version)],
            test_plan_text_who_idx     => ['who'],
        ],
      },
    
      # Tiny table -- don't add keys besides primary key.
      $schema->{test_plan_types} = {
        FIELDS => [
            type_id     => { TYPE => 'SMALLSERIAL', PRIMARYKEY => 1, NOTNULL => 1 },
            name        => { TYPE => 'varchar(64)', NOTNULL    => 1 },
            description => { TYPE => 'MEDIUMTEXT' },
        ],
      },
      $schema->{test_runs} = {
        FIELDS => [
            run_id  => { TYPE => 'INTSERIAL', PRIMARYKEY => 1, NOTNULL => 1 },
            plan_id => {
                TYPE       => 'INT4',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_plans',
                    COLUMN => 'plan_id',
                    DELETE => 'CASCADE'
                }
            },
            environment_id => {
                TYPE       => 'INT4',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_environments',
                    COLUMN => 'environment_id',
                    DELETE => 'CASCADE'
                }
            },
            product_version => { TYPE => 'MEDIUMTEXT' },
            build_id        => {
                TYPE       => 'INT4',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_builds',
                    COLUMN => 'build_id',
                    DELETE => 'CASCADE'
                }
            },
            plan_text_version => { TYPE => 'INT4', NOTNULL => 1 },
            manager_id        => {
                TYPE       => 'INT3',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'profiles',
                    COLUMN => 'userid',
                    DELETE => 'CASCADE'
                }
            },
            default_tester_id => {
                TYPE       => 'INT3',
            },
            start_date        => { TYPE => 'DATETIME', NOTNULL => 1 },
            stop_date         => { TYPE => 'DATETIME' },
            summary           => { TYPE => 'TINYTEXT', NOTNULL => 1 },
            notes             => { TYPE => 'MEDIUMTEXT' },
            target_pass       => { TYPE => 'INT1' },
            target_completion => { TYPE => 'INT1' },
    
        ],
        INDEXES => [
            test_run_plan_id_run_id_idx => [qw(plan_id run_id)],
            test_run_manager_idx        => ['manager_id'],
            test_run_start_date_idx     => ['start_date'],
            test_run_stop_date_idx      => ['stop_date'],
            test_run_env_idx            => ['environment_id'],
            test_run_build_idx          => ['build_id'],
            test_run_plan_ver_idx       => ['plan_text_version'],
            test_run_tester_idx         => ['default_tester_id'],
        ],
      },
      $schema->{test_case_plans} = {
        FIELDS => [
            plan_id => {
                TYPE       => 'INT4',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_plans',
                    COLUMN => 'plan_id',
                    DELETE => 'CASCADE'
                }
            },
            case_id => {
                TYPE       => 'INT4',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_cases',
                    COLUMN => 'case_id',
                    DELETE => 'CASCADE'
                }
            },
        ],
        INDEXES => [
            test_case_plans_primary_idx => { FIELDS => [qw(plan_id case_id)], TYPE => 'UNIQUE' },
            test_case_plans_case_idx    => [qw(case_id)],
        ],
      },
      $schema->{test_case_activity} = {
        FIELDS => [
            case_id => {
                TYPE       => 'INT4',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_cases',
                    COLUMN => 'case_id',
                    DELETE => 'CASCADE'
                }
            },
            fieldid => {
                TYPE       => 'INT2',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_fielddefs',
                    COLUMN => 'fieldid',
                    DELETE => 'CASCADE'
                }
            },
            who => {
                TYPE       => 'INT3',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'profiles',
                    COLUMN => 'userid',
                }
            },
            changed  => { TYPE => 'DATETIME', NOTNULL => 1 },
            oldvalue => { TYPE => 'MEDIUMTEXT' },
            newvalue => { TYPE => 'MEDIUMTEXT' },
        ],
        INDEXES => [
            case_activity_case_id_idx => ['case_id'],
            case_activity_who_idx     => ['who'],
            case_activity_when_idx    => ['changed'],
            case_activity_field_idx   => ['fieldid'],
        ],
      },
    
      # Tiny table -- don't add keys besides primary key.
      $schema->{test_fielddefs} = {
        FIELDS => [
            fieldid     => { TYPE => 'SMALLSERIAL',  PRIMARYKEY => 1, NOTNULL => 1 },
            name        => { TYPE => 'varchar(100)', NOTNULL    => 1 },
            description => { TYPE => 'MEDIUMTEXT' },
            table_name => { TYPE => 'varchar(100)', NOTNULL => 1 },
        ],
      },
      $schema->{test_plan_activity} = {
        FIELDS => [
            plan_id => {
                TYPE       => 'INT4',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_plans',
                    COLUMN => 'plan_id',
                    DELETE => 'CASCADE'
                }
            },
            fieldid => {
                TYPE       => 'INT2',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_fielddefs',
                    COLUMN => 'fieldid',
                    DELETE => 'CASCADE'
                }
            },
            who => {
                TYPE       => 'INT3',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'profiles',
                    COLUMN => 'userid',
                }
            },
            changed  => { TYPE => 'DATETIME', NOTNULL => 1 },
            oldvalue => { TYPE => 'MEDIUMTEXT' },
            newvalue => { TYPE => 'MEDIUMTEXT' },
        ],
        INDEXES => [
            plan_activity_primary_idx => ['plan_id'],
            plan_activity_field_idx   => ['fieldid'],
            plan_activity_who_idx     => ['who'],
            plan_activity_changed_idx => ['changed'],
        ],
      },
      $schema->{test_case_components} = {
        FIELDS => [
            case_id => {
                TYPE       => 'INT4',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_cases',
                    COLUMN => 'case_id',
                    DELETE => 'CASCADE'
                }
            },
            component_id => {
                TYPE       => 'INT2',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'components',
                    COLUMN => 'id',
                    DELETE => 'CASCADE'
                  }
    
            },
        ],
        INDEXES => [
            components_case_id_idx      => { FIELDS => [qw(case_id component_id)], TYPE => 'UNIQUE' },
            components_component_id_idx => ['component_id'],
        ],
      },
      $schema->{test_run_activity} = {
        FIELDS => [
            run_id => {
                TYPE       => 'INT4',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_runs',
                    COLUMN => 'run_id',
                    DELETE => 'CASCADE'
                }
            },
            fieldid => {
                TYPE       => 'INT2',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_fielddefs',
                    COLUMN => 'fieldid',
                    DELETE => 'CASCADE'
                }
            },
            who => {
                TYPE       => 'INT3',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'profiles',
                    COLUMN => 'userid',
                }
            },
            changed  => { TYPE => 'DATETIME', NOTNULL => 1 },
            oldvalue => { TYPE => 'MEDIUMTEXT' },
            newvalue => { TYPE => 'MEDIUMTEXT' },
        ],
        INDEXES => [
            run_activity_run_id_idx => ['run_id'],
            run_activity_field_idx  => ['fieldid'],
            run_activity_who_idx    => ['who'],
            run_activity_when_idx   => ['changed'],
        ],
      },
      $schema->{test_run_cc} = {
        FIELDS => [
            run_id => {
                TYPE       => 'INT4',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_runs',
                    COLUMN => 'run_id',
                    DELETE => 'CASCADE'
                }
            },
            who => {
                TYPE       => 'INT3',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'profiles',
                    COLUMN => 'userid',
                    DELETE => 'CASCADE'
                }
            },
        ],
        INDEXES => [
            test_run_cc_primary_idx => { FIELDS => [qw(run_id who)], TYPE => 'UNIQUE' },
            test_run_cc_who_idx     => [qw(who)],
        ],
      },
      $schema->{test_email_settings} = {
        FIELDS => [
            userid => {
                TYPE       => 'INT3',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'profiles',
                    COLUMN => 'userid',
                }
            },
            eventid => {
                TYPE       => 'INT1',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_events',
                    COLUMN => 'eventid',
                    DELETE => 'CASCADE'
                }
            },
            relationship_id => {
                TYPE       => 'INT1',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_relationships',
                    COLUMN => 'relationship_id',
                    DELETE => 'CASCADE'
                }
            },
        ],
        INDEXES => [
            test_email_setting_user_id_idx => {
                FIELDS => [qw(userid relationship_id eventid)],
                TYPE   => 'UNIQUE'
            },
        ],
      },
      $schema->{test_events} = {
        FIELDS => [
            eventid => { TYPE => 'INT1', PRIMARYKEY => 1, NOTNULL => 1 },
            name    => { TYPE => 'varchar(50)' },
        ],
        INDEXES => [ test_event_name_idx => ['name'], ],
      },
      $schema->{test_relationships} = {
        FIELDS => [
            relationship_id => { TYPE => 'INT1', PRIMARYKEY => 1, NOTNULL => 1 },
            name            => { TYPE => 'varchar(50)' },
        ],
      },
    
      # Tiny table -- don't add keys besides primary key.
      $schema->{test_case_run_status} = {
        FIELDS => [
            case_run_status_id => { TYPE => 'SMALLSERIAL', PRIMARYKEY => 1, NOTNULL => 1 },
            name               => { TYPE => 'varchar(20)' },
            sortkey            => { TYPE => 'INT4' },
            description        => { TYPE => 'TEXT' },
        ],
      },
    
      # Tiny table -- don't add keys besides primary key.
      $schema->{test_case_status} = {
        FIELDS => [
            case_status_id => { TYPE => 'SMALLSERIAL',  PRIMARYKEY => 1, NOTNULL => 1 },
            name           => { TYPE => 'varchar(255)', NOTNULL    => 1 },
            description    => { TYPE => 'TEXT' },
        ],
      },
      $schema->{test_case_dependencies} = {
        FIELDS => [
            dependson => { TYPE => 'INT4', NOTNULL => 1 },
            blocked   => { TYPE => 'INT4', NOTNULL => 1 },
        ],
        INDEXES => [
            case_dependencies_primary_idx => { FIELDS => [qw(dependson blocked)], TYPE => 'UNIQUE' },
            case_dependencies_blocked_idx => ['blocked'],
        ],
      },
      $schema->{test_environments} = {
        FIELDS => [
            environment_id => { TYPE => 'INTSERIAL', PRIMARYKEY => 1, NOTNULL => 1 },
            product_id     => {
                TYPE       => 'INT2',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'products',
                    COLUMN => 'id',
                    DELETE => 'CASCADE'
                }
            },
            name     => { TYPE => 'varchar(255)' },
            isactive => { TYPE => 'BOOLEAN', NOTNULL => 1, DEFAULT => '1' },
        ],
        INDEXES => [
            test_environments_key1  => { FIELDS => [qw(environment_id product_id)], TYPE => 'UNIQUE' },
            test_environments_key2  => { FIELDS => [qw(product_id name)],           TYPE => 'UNIQUE' },
            environment_name_idx_v2 => ['name'],
        ],
      },
      $schema->{test_builds} = {
        FIELDS => [
            build_id   => { TYPE => 'INTSERIAL', PRIMARYKEY => 1, NOTNULL => 1 },
            product_id => {
                TYPE       => 'INT2',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'products',
                    COLUMN => 'id',
                    DELETE => 'CASCADE'
                }
            },
            milestone   => { TYPE => 'varchar(20)' },
            name        => { TYPE => 'varchar(255)' },
            description => { TYPE => 'TEXT' },
            isactive    => { TYPE => 'BOOLEAN', NOTNULL => 1, DEFAULT => '1' },
        ],
        INDEXES => [
            build_name_idx            => ['name'],
            build_milestone_idx       => ['milestone'],
            build_product_id_name_idx => { FIELDS => [qw(product_id name)], TYPE => 'UNIQUE' },
            build_prod_idx            => { FIELDS => [qw(build_id product_id)], TYPE => 'UNIQUE' },
        ],
      },
      $schema->{test_attachment_data} = {
        FIELDS => [
            attachment_id => {
                TYPE       => 'INT4',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_attachments',
                    COLUMN => 'attachment_id',
                    DELETE => 'CASCADE'
                }
            },
            contents => { TYPE => 'LONGBLOB' },
        ],
        INDEXES => [ test_attachment_data_primary_idx => ['attachment_id'], ],
      },
      $schema->{test_named_queries} = {
        FIELDS => [
            userid => {
                TYPE       => 'INT3',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'profiles',
                    COLUMN => 'userid',
                    DELETE => 'CASCADE'
                }
            },
            name      => { TYPE => 'varchar(64)', NOTNULL => 1 },
            isvisible => { TYPE => 'BOOLEAN',     NOTNULL => 1, DEFAULT => 1 },
            query     => { TYPE => 'MEDIUMTEXT',  NOTNULL => 1 },
            type      => { TYPE => 'INT3',        NOTNULL => 1, DEFAULT => 0 },
        ],
        INDEXES => [
            test_namedquery_primary_idx => { FIELDS => [qw(userid name)], TYPE => 'UNIQUE' },
            test_namedquery_name_idx    => ['name'],
        ],
      },
      $schema->{test_environment_map} = {
        FIELDS => [
            environment_id => {
                TYPE       => 'INT4',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_environments',
                    COLUMN => 'environment_id',
                    DELETE => 'CASCADE'
                }
            },
            property_id => {
                TYPE       => 'INT4',
                NOTNULL    => 1,
            },
            element_id => {
                TYPE       => 'INT4',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_environment_element',
                    COLUMN => 'element_id',
                    DELETE => 'CASCADE'
                }
            },
            value_selected => { TYPE => 'TINYTEXT' },
        ],
        INDEXES => [
            env_map_env_element_idx   => [qw(environment_id element_id)],
            env_map_property_idx      => [qw(environment_id property_id)],
            test_environment_map_key3 => { FIELDS => [qw(environment_id element_id property_id)], TYPE => 'UNIQUE' },
        ],
      },
      $schema->{test_environment_element} = {
        FIELDS => [
            element_id      => { TYPE => 'INTSERIAL', PRIMARYKEY => 1, NOTNULL => 1 },
            env_category_id => {
                TYPE       => 'INT4',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_environment_category',
                    COLUMN => 'env_category_id',
                    DELETE => 'CASCADE'
                }
            },
            name      => { TYPE => 'varchar(255)' },
            parent_id => { TYPE => 'INT4' },
            isprivate => { TYPE => 'BOOLEAN', NOTNULL => 1, DEFAULT => 0 },
        ],
        INDEXES => [
            test_environment_element_key1 => { FIELDS => [qw(element_id env_category_id)], TYPE => 'UNIQUE' },
            test_environment_element_key2 => { FIELDS => [qw(env_category_id name)],       TYPE => 'UNIQUE' },
        ],
      },
      $schema->{test_environment_category} = {
        FIELDS => [
            env_category_id => { TYPE => 'INTSERIAL', PRIMARYKEY => 1, NOTNULL => 1 },
            product_id      => {
                TYPE       => 'INT2',
                NOTNULL    => 1,
            },
            name => { TYPE => 'varchar(255)' },
        ],
        INDEXES => [
            test_environment_category_key1 => { FIELDS => [qw(env_category_id product_id)], TYPE => 'UNIQUE' },
            test_environment_category_key2 => { FIELDS => [qw(product_id name)],            TYPE => 'UNIQUE' },
        ],
      },
      $schema->{test_environment_property} = {
        FIELDS => [
            property_id => { TYPE => 'INTSERIAL', PRIMARYKEY => 1, NOTNULL => 1 },
            element_id  => {
                TYPE       => 'INT4',
                NOTNULL    => 1,
                REFERENCES => {
                    TABLE  => 'test_environment_element',
                    COLUMN => 'element_id',
                    DELETE => 'CASCADE'
                }
            },
            name     => { TYPE => 'varchar(255)' },
            validexp => { TYPE => 'TEXT' },
        ],
        INDEXES => [
            test_environment_property_key1 => { FIELDS => [qw(property_id element_id)], TYPE => 'UNIQUE' },
            test_environment_property_key2 => { FIELDS => [qw(element_id name)],        TYPE => 'UNIQUE' },
        ],
      },
}

sub enter_bug_entrydefaultvars {
    my ($self, $args) = @_;
    
    my $vars = $args->{vars};
    my $cgi = Bugzilla->cgi;
    
    $vars->{'case_id'} = $cgi->param('case_id');
    $vars->{'caserun_id'} = $cgi->param('caserun_id');
}

sub install_before_final_checks {
    my ($self, $args) = @_;
    
    
    add_setting('view_testopia', ['on', 'off'], 'on');
    
    if ( -e './testopia/patch-3.2'){
        print <<END;
    
        WARNING:
        We are about to remove the old Testopia files that have been moved 
        to the extensions directory. If you have made any changes to Testopia
        you should first merge these changes into the equivilent files in the
        extensions/Testopia directory. Here are a list of files that are changing
        and their new locations:
        
            testopia (dir)   -> extensions/Testopia/
            Bugzilla/Testopia/ (dir) -> extensions/Testopia/lib
            Bugzilla/WebService/Testopia/ (dir) -> extensions/Testopia/lig/WebService
            Bugzilla/Config/Testopia.pm -> extensions/Testopia/lib/Testopia/Config.pm
            skins/standard/testopia.css -> extensions/Testopia/css/testopia.css
            template/en/default/testopia/ (dir) -> extensions/Testopia/template/en/default
            
            The following templates and template hooks have been moved to the 
                extensions/Testopia/template directory:
                
            template/en/default/admin/params/testopia.html.tmpl 
            template/en/default/hook/admin/products/confirm-delete.html.tmpl
            template/en/default/hook/admin/products/confirm-delete.html.tmpl/confirmation/testopia.html.tmpl
            template/en/default/hook/bug/create/created.html.tmpl/message/tr.html.tmpl
            template/en/default/hook/bug/create/create.html.tmpl/end/tr.html.tmpl
            template/en/default/hook/bug/create/create.html.tmpl/form/tr.html.tmpl
            template/en/default/hook/bug/edit.html.tmpl/after_custom_fields/tr.html.tmpl
            template/en/default/hook/bug/process/results.html.tmpl/links/tr.html.tmpl
            template/en/default/hook/global/banner.html.tmpl/version/testopia.html.tmpl
            template/en/default/hook/global/code-error.html.tmpl/errors/testopia_errors.html.tmpl
            template/en/default/hook/global/common-links.html.tmpl/link-row/testopia.html.tmpl
            template/en/default/hook/global/header.html.tmpl/additional_header/testopia_styles.html.tmpl
            template/en/default/hook/global/useful-links.html.tmpl/end/tr.html.tmpl
            template/en/default/hook/global/user-error.html.tmpl/errors/tr-user-error.html.tmpl
            template/en/default/hook/index.html.tmpl/links/tr.html.tmpl
            template/en/default/hook/list/list.html.tmpl/links/tr.html.tmpl
            
            The following files are no longer needed and will be removed:
            
            testopia.dtd    (use extensions/Testopia/testopia.xsd instead)
            tr_csv2xml.pl   (use tr_importer.cgi instead)
            tr_xmlrpc.cgi   (use bugzilla's xmlrpc or create a link to it)
        
        If you have changes to merge, you should answer NO. Otherwise answer YES.
        Do you wish to continue and delete these files? (YES/no)
        
END
        my $response = <STDIN>;
        die "Exiting... \n" if $response !~ /y/i;
        
        my @files = qw(
            testopia
            testopia.dtd
            tr_csv2xml.pl
            tr_xmlrpc.cgi
            Bugzilla/Testopia/
            Bugzilla/WebService/Testopia/
            Bugzilla/Config/Testopia.pm 
            skins/standard/testopia.css 
            template/en/default/testopia/
            template/en/default/admin/params/testopia.html.tmpl 
            template/en/default/hook/admin/products/confirm-delete.html.tmpl
            template/en/default/hook/admin/products/confirm-delete.html.tmpl/confirmation/testopia.html.tmpl
            template/en/default/hook/bug/create/created.html.tmpl/message/tr.html.tmpl
            template/en/default/hook/bug/create/create.html.tmpl/end/tr.html.tmpl
            template/en/default/hook/bug/create/create.html.tmpl/form/tr.html.tmpl
            template/en/default/hook/bug/edit.html.tmpl/after_custom_fields/tr.html.tmpl
            template/en/default/hook/bug/process/results.html.tmpl/links/tr.html.tmpl
            template/en/default/hook/global/banner.html.tmpl/version/testopia.html.tmpl
            template/en/default/hook/global/code-error.html.tmpl/errors/testopia_errors.html.tmpl
            template/en/default/hook/global/common-links.html.tmpl/link-row/testopia.html.tmpl
            template/en/default/hook/global/header.html.tmpl/additional_header/testopia_styles.html.tmpl
            template/en/default/hook/global/useful-links.html.tmpl/end/tr.html.tmpl
            template/en/default/hook/global/user-error.html.tmpl/errors/tr-user-error.html.tmpl
            template/en/default/hook/index.html.tmpl/links/tr.html.tmpl
            template/en/default/hook/list/list.html.tmpl/links/tr.html.tmpl
        );
        
        rmtree(@files, 1);
    }
}

sub install_update_db {
    my ($self, $args) = @_;
    
    
    # Start of main().
    print "\nChecking Testopia setup ...\n";
    testopiaUpdateDB();
    updateACLs();
    migrateAttachments();
    createGroup();
    finalFixups();
    print "Done checking Testopia setup.\n\n";
    # End of main().
    
    sub testopiaUpdateDB {
        my $dbh = Bugzilla->dbh;
    
        # If the database contains Testopia tables but bz_schema doesn't
        # know about them, then we need to update bz_schema.
        if (grep(/^test_cases$/, $dbh->bz_table_list_real) and
                !$dbh->_bz_real_schema->get_table_abstract('test_cases')) {
            my $msg = "Sorry, we cannot upgrade from Testopia 1.0 using this " .
                "database. Upgrades are supported only with MySQL.";
            die($msg) unless $dbh->isa('Bugzilla::DB::Mysql');
            my $built_schema = $dbh->_bz_build_schema_from_disk;
            foreach my $table (grep(/^test_/, $built_schema->get_table_list())) {
                $dbh->_bz_real_schema->add_table($table,
                    $built_schema->get_table_abstract($table));
            }
            $dbh->_bz_store_real_schema;
        }
    
        $dbh->bz_setup_database();
    
        $dbh->bz_drop_table('test_case_group_map');
        $dbh->bz_drop_table('test_category_templates');
        $dbh->bz_drop_table('test_plan_testers');
        $dbh->bz_drop_table('test_plan_group_map');
        $dbh->bz_drop_column('test_plans', 'editor_id');
        
        $dbh->bz_drop_fk('test_cases', 'priority_id') if $dbh->bz_column_info('test_cases','priority_id')->{REFERENCES}->{DELETE} eq 'CASCADE';
        $dbh->bz_drop_fk('test_environment_map', 'property_id');
        
        $dbh->bz_add_column('test_case_bugs', 'case_id', {TYPE => 'INT4'});
        $dbh->bz_add_column('test_case_runs', 'environment_id', {TYPE => 'INT4', NOTNULL => 1}, 0);
        $dbh->bz_add_column('test_case_tags', 'userid', {TYPE => 'INT3', NOTNULL => 1}, 0);
        $dbh->bz_add_column('test_case_texts', 'setup', {TYPE => 'MEDIUMTEXT'});
        $dbh->bz_add_column('test_case_texts', 'breakdown', {TYPE => 'MEDIUMTEXT'});
        $dbh->bz_add_column('test_environments', 'product_id', {TYPE => 'INT2', NOTNULL => 1}, 0);
        $dbh->bz_add_column('test_environments', 'isactive', {TYPE => 'BOOLEAN', NOTNULL => 1, DEFAULT => '1'}, 1);
        $dbh->bz_add_column('test_plan_tags', 'userid', {TYPE => 'INT3', NOTNULL => 1}, 0);
        $dbh->bz_add_column('test_runs', 'default_tester_id', {TYPE => 'INT3'});
        $dbh->bz_add_column('test_runs', 'target_pass', {TYPE => 'INT1'});
        $dbh->bz_add_column('test_runs', 'target_completion', {TYPE => 'INT1'});
        $dbh->bz_add_column('test_run_tags', 'userid', {TYPE => 'INT3', NOTNULL => 1}, 0);
        $dbh->bz_add_column('test_builds', 'isactive', {TYPE => 'BOOLEAN', NOTNULL => 1, DEFAULT => '1'}, 1);
        $dbh->bz_add_column('test_cases', 'estimated_time', {TYPE => 'TIME'}, 0);
        $dbh->bz_add_column('test_case_runs', 'running_date', {TYPE => 'DATETIME'}, 0);
        $dbh->bz_add_column('test_plan_types', 'description', {TYPE => 'MEDIUMTEXT'}, 0);
        $dbh->bz_add_column('test_case_status', 'description', {TYPE => 'MEDIUMTEXT'}, 0);
        $dbh->bz_add_column('test_case_run_status', 'description', {TYPE => 'MEDIUMTEXT'}, 0);
        $dbh->bz_add_column('test_case_runs', 'iscurrent', {TYPE => 'INT1', NOTNULL => 1, DEFAULT => 0}, 0);
        $dbh->bz_add_column('test_case_runs', 'priority_id', {TYPE => 'INT2', NOTNULL => 1, DEFAULT => 0}, 0);
        $dbh->bz_add_column('test_named_queries', 'type', {TYPE => 'INT3', NOTNULL => 1, DEFAULT => 0}, 0);
        fixTables();
    
        $dbh->bz_alter_column('test_attachment_data', 'attachment_id', {TYPE => 'INT4', NOTNULL => 1, REFERENCES => {
                    TABLE  => 'test_attachments',
                    COLUMN => 'attachment_id',
                    DELETE => 'CASCADE'
                }});
        $dbh->bz_alter_column('test_attachments', 'attachment_id', {TYPE => 'INTSERIAL', PRIMARYKEY => 1, NOTNULL => 1});
        $dbh->bz_alter_column('test_attachments', 'creation_ts', {TYPE => 'DATETIME', NOTNULL => 1});
        $dbh->bz_alter_column('test_builds', 'build_id', {TYPE => 'INTSERIAL', PRIMARYKEY => 1, NOTNULL => 1});
        $dbh->bz_alter_column('test_case_activity', 'case_id', {TYPE => 'INT4', NOTNULL => 1, REFERENCES => {
                    TABLE  => 'test_cases',
                    COLUMN => 'case_id',
                    DELETE => 'CASCADE'
                }});
        $dbh->bz_alter_column('test_case_bugs', 'case_id', {TYPE => 'INT4', NOTNULL => 1, REFERENCES => {
                    TABLE  => 'test_cases',
                    COLUMN => 'case_id',
                    DELETE => 'CASCADE'
                }});
        $dbh->bz_alter_column('test_case_bugs', 'case_run_id', {TYPE => 'INT4', REFERENCES => {
                    TABLE  => 'test_case_runs',
                    COLUMN => 'case_run_id',
                    DELETE => 'CASCADE'
                }});
        $dbh->bz_alter_column('test_case_components', 'case_id', {TYPE => 'INT4', NOTNULL => 1, REFERENCES => {
                    TABLE  => 'test_cases',
                    COLUMN => 'case_id',
                    DELETE => 'CASCADE'
                }});
        $dbh->bz_alter_column('test_case_dependencies', 'blocked', {TYPE => 'INT4', NOTNULL => 1});
        $dbh->bz_alter_column('test_case_dependencies', 'dependson', {TYPE => 'INT4', NOTNULL => 1});
        $dbh->bz_alter_column('test_case_plans', 'case_id', {TYPE => 'INT4', NOTNULL => 1, REFERENCES => {
                    TABLE  => 'test_cases',
                    COLUMN => 'case_id',
                    DELETE => 'CASCADE'
                }});
        $dbh->bz_alter_column('test_case_plans', 'plan_id', {TYPE => 'INT4', NOTNULL => 1, REFERENCES => {
                    TABLE  => 'test_plans',
                    COLUMN => 'plan_id',
                    DELETE => 'CASCADE'
                }});
        $dbh->bz_alter_column('test_case_runs', 'build_id', {TYPE => 'INT4', NOTNULL => 1, REFERENCES => {
                    TABLE  => 'test_builds',
                    COLUMN => 'build_id',
                    DELETE => 'CASCADE'
                }});
        $dbh->bz_alter_column('test_case_runs', 'case_id', {TYPE => 'INT4', NOTNULL => 1, REFERENCES => {
                    TABLE  => 'test_cases',
                    COLUMN => 'case_id',
                    DELETE => 'CASCADE'
                }});
        $dbh->bz_alter_column('test_case_runs', 'case_run_status_id', {TYPE => 'INT2', NOTNULL => 1});
        $dbh->bz_alter_column('test_case_runs', 'case_run_id', {TYPE => 'INTSERIAL', PRIMARYKEY => 1, NOTNULL => 1});
        $dbh->bz_alter_column('test_case_runs', 'environment_id', {TYPE => 'INT4', NOTNULL => 1, REFERENCES => {
                    TABLE  => 'test_environments',
                    COLUMN => 'environment_id',
                    DELETE => 'CASCADE'
                }});
        $dbh->bz_alter_column('test_case_runs', 'iscurrent', {TYPE => 'BOOLEAN', NOTNULL => 1, DEFAULT => '0'});
        $dbh->bz_alter_column('test_case_runs', 'run_id', {TYPE => 'INT4', NOTNULL => 1, REFERENCES => {
                    TABLE  => 'test_runs',
                    COLUMN => 'run_id',
                    DELETE => 'CASCADE'
                }});
        $dbh->bz_alter_column('test_case_run_status', 'case_run_status_id', {TYPE => 'SMALLSERIAL', PRIMARYKEY => 1, NOTNULL => 1});
        $dbh->bz_alter_column('test_cases', 'case_id', {TYPE => 'INTSERIAL', PRIMARYKEY => 1, NOTNULL => 1});
        $dbh->bz_alter_column('test_cases', 'case_status_id', {TYPE => 'INT2', NOTNULL => 1});
        $dbh->bz_alter_column('test_case_status', 'case_status_id', {TYPE => 'SMALLSERIAL', PRIMARYKEY => 1, NOTNULL => 1});
        $dbh->bz_alter_column('test_case_tags', 'case_id', {TYPE => 'INT4', NOTNULL => 1, REFERENCES => {
                    TABLE  => 'test_cases',
                    COLUMN => 'case_id',
                    DELETE => 'CASCADE'
                }});
        $dbh->bz_alter_column('test_case_texts', 'case_id', {TYPE => 'INT4', NOTNULL => 1, REFERENCES => {
                    TABLE  => 'test_cases',
                    COLUMN => 'case_id',
                    DELETE => 'CASCADE'
                }});
        $dbh->bz_alter_column('test_case_texts', 'creation_ts', {TYPE => 'DATETIME', NOTNULL => 1, REFERENCES => {
                    TABLE  => 'test_cases',
                    COLUMN => 'case_id',
                    DELETE => 'CASCADE'
                }});
        $dbh->bz_alter_column('test_environment_map', 'environment_id', {TYPE => 'INT4', NOTNULL => 1, REFERENCES => {
                    TABLE  => 'test_cases',
                    COLUMN => 'case_id',
                    DELETE => 'CASCADE'
                }});
        $dbh->bz_alter_column('test_environment_map', 'property_id', {TYPE => 'INT4'});    
        $dbh->bz_alter_column('test_environment_property', 'property_id', {TYPE => 'INTSERIAL', PRIMARYKEY => 1, NOTNULL => 1});
        $dbh->bz_alter_column('test_environments', 'environment_id', {TYPE => 'INTSERIAL', PRIMARYKEY => 1, NOTNULL => 1});
        $dbh->bz_alter_column('test_named_queries', 'isvisible', {TYPE => 'BOOLEAN', NOTNULL => 1, DEFAULT => 1});
        $dbh->bz_alter_column('test_plan_activity', 'plan_id', {TYPE => 'INT4', NOTNULL => 1, REFERENCES => {
                    TABLE  => 'test_plans',
                    COLUMN => 'plan_id',
                    DELETE => 'CASCADE'
                }});
        $dbh->bz_alter_column('test_plans', 'plan_id', {TYPE => 'INTSERIAL', PRIMARYKEY => 1, NOTNULL => 1});
        $dbh->bz_alter_column('test_plans', 'type_id', {TYPE => 'INT2', NOTNULL => 1});
        $dbh->bz_alter_column('test_plan_types', 'type_id', {TYPE => 'SMALLSERIAL', NOTNULL => 1, PRIMARYKEY => 1}, 0);
        $dbh->bz_alter_column('test_plan_tags', 'plan_id', {TYPE => 'INT4', NOTNULL => 1, REFERENCES => {
                    TABLE  => 'test_tags',
                    COLUMN => 'tag_id',
                    DELETE => 'CASCADE'
                }});
        $dbh->bz_alter_column('test_plan_texts', 'creation_ts', {TYPE => 'DATETIME', NOTNULL => 1});
        $dbh->bz_alter_column('test_plan_texts', 'plan_id', {TYPE => 'INT4', NOTNULL => 1, REFERENCES => {
                    TABLE  => 'test_plans',
                    COLUMN => 'plan_id',
                    DELETE => 'CASCADE'
                }});
        $dbh->bz_alter_column('test_plan_texts', 'plan_text', {TYPE => 'MEDIUMTEXT'});
        $dbh->bz_alter_column('test_run_activity', 'run_id', {TYPE => 'INT4', NOTNULL => 1, REFERENCES => {
                    TABLE  => 'test_runs',
                    COLUMN => 'run_id',
                    DELETE => 'CASCADE'
                }});
        $dbh->bz_alter_column('test_run_cc', 'run_id', {TYPE => 'INT4', NOTNULL => 1, REFERENCES => {
                    TABLE  => 'test_runs',
                    COLUMN => 'run_id',
                    DELETE => 'CASCADE'
                }});
        $dbh->bz_alter_column('test_runs', 'build_id', {TYPE => 'INT4', NOTNULL => 1, REFERENCES => {
                    TABLE  => 'test_builds',
                    COLUMN => 'build_id',
                    DELETE => 'CASCADE'
                }});
        $dbh->bz_alter_column('test_runs', 'environment_id', {TYPE => 'INT4', NOTNULL => 1, REFERENCES => {
                    TABLE  => 'test_environments',
                    COLUMN => 'environment_id',
                    DELETE => 'CASCADE'
                }});
        $dbh->bz_alter_column('test_runs', 'plan_id', {TYPE => 'INT4', NOTNULL => 1, REFERENCES => {
                    TABLE  => 'test_plans',
                    COLUMN => 'plan_id',
                    DELETE => 'CASCADE'
                }});
        $dbh->bz_alter_column('test_runs', 'run_id', {TYPE => 'INTSERIAL', PRIMARYKEY => 1, NOTNULL => 1});
        $dbh->bz_alter_column('test_runs', 'start_date', {TYPE => 'DATETIME', NOTNULL => 1});
        $dbh->bz_alter_column('test_run_tags', 'run_id', {TYPE => 'INT4', NOTNULL => 1, REFERENCES => {
                    TABLE  => 'test_runs',
                    COLUMN => 'run_id',
                    DELETE => 'CASCADE'
                }});
    
        $dbh->bz_drop_index('test_attachments', 'AI_attachment_id');
        $dbh->bz_drop_index('test_attachments', 'attachment_id');
        $dbh->bz_drop_index('test_builds', 'build_id');
        $dbh->bz_drop_index('test_case_bugs', 'case_run_bug_id_idx');
        $dbh->bz_drop_index('test_case_bugs', 'case_run_id_idx');
        $dbh->bz_drop_index('test_case_categories', 'AI_category_id');
        $dbh->bz_drop_index('test_case_categories', 'category_name_idx');
        $dbh->bz_drop_index('test_case_categories', 'category_name_indx');
        $dbh->bz_drop_index('test_case_components', 'case_commponents_component_id_idx');
        $dbh->bz_drop_index('test_case_components', 'case_components_case_id_idx');
        $dbh->bz_drop_index('test_case_components', 'case_components_component_id_idx');
        $dbh->bz_drop_index('test_case_plans', 'case_plans_case_id_idx');
        $dbh->bz_drop_index('test_case_plans', 'case_plans_plan_id_idx');
        $dbh->bz_drop_index('test_case_runs', 'AI_case_run_id');
        $dbh->bz_drop_index('test_case_runs', 'case_run_build_idx');
        $dbh->bz_drop_index('test_case_runs', 'case_run_env_idx');
        $dbh->bz_drop_index('test_case_runs', 'case_run_id');
        $dbh->bz_drop_index('test_case_runs', 'case_run_id_2');
        $dbh->bz_drop_index('test_case_runs', 'case_run_run_id_idx');
        $dbh->bz_drop_index('test_case_runs', 'case_run_shortkey_idx');
        $dbh->bz_drop_index('test_case_runs', 'case_run_sortkey_idx');
        $dbh->bz_drop_index('test_case_run_status', 'AI_case_run_status_id');
        $dbh->bz_drop_index('test_case_run_status', 'case_run_status_name_idx');
        $dbh->bz_drop_index('test_case_run_status', 'case_run_status_sortkey_idx');
        $dbh->bz_drop_index('test_case_run_status', 'sortkey');
        $dbh->bz_drop_index('test_cases', 'AI_case_id');
        $dbh->bz_drop_index('test_cases', 'alias');
        $dbh->bz_drop_index('test_cases', 'case_id');
        $dbh->bz_drop_index('test_cases', 'case_id_2');
        $dbh->bz_drop_index('test_case_status', 'AI_case_status_id');
        $dbh->bz_drop_index('test_case_status', 'case_status_id');
        $dbh->bz_drop_index('test_case_status', 'test_case_status_name_idx');
        $dbh->bz_drop_index('test_cases', 'test_case_requirment_idx');
        $dbh->bz_drop_index('test_case_tags', 'case_tags_case_id_idx');
        $dbh->bz_drop_index('test_case_tags', 'case_tags_case_id_idx_v2');
        $dbh->bz_drop_index('test_case_tags', 'case_tags_tag_id_idx');
        $dbh->bz_drop_index('test_case_tags', 'case_tags_user_idx');
        $dbh->bz_drop_index('test_email_settings', 'test_event_user_event_dx');
        $dbh->bz_drop_index('test_email_settings', 'test_event_user_event_idx');
        $dbh->bz_drop_index('test_email_settings', 'test_event_user_relationship_idx');
        $dbh->bz_drop_index('test_environment_category', 'env_category_idx');
        $dbh->bz_drop_index('test_environment_element', 'env_element_category_idx');
        $dbh->bz_drop_index('test_environment_property', 'env_element_property_idx');
        $dbh->bz_drop_index('test_environments', 'environment_id');
        $dbh->bz_drop_index('test_environments', 'environment_name_idx');
        $dbh->bz_drop_index('test_fielddefs', 'AI_fieldid');
        $dbh->bz_drop_index('test_fielddefs', 'fielddefs_name_idx') if $dbh->isa('Bugzilla::DB::Mysql');
        $dbh->bz_drop_index('test_fielddefs', 'test_fielddefs_name_idx');
        $dbh->bz_drop_index('test_plans', 'AI_plan_id');
        $dbh->bz_drop_index('test_plans', 'plan_id');
        $dbh->bz_drop_index('test_plans', 'plan_id_2');
        $dbh->bz_drop_index('test_plan_tags', 'plan_tags_idx');
        $dbh->bz_drop_index('test_plan_tags', 'plan_tags_user_idx');
        $dbh->bz_drop_index('test_plan_types', 'AI_type_id');
        $dbh->bz_drop_index('test_plan_types', 'plan_type_name_idx');
        $dbh->bz_drop_index('test_run_cc', 'run_cc_run_id_who_idx');
        $dbh->bz_drop_index('test_runs', 'AI_run_id');
        $dbh->bz_drop_index('test_runs', 'run_id');
        $dbh->bz_drop_index('test_runs', 'run_id_2');
        $dbh->bz_drop_index('test_runs', 'test_run_plan_id_run_id__idx');
        $dbh->bz_drop_index('test_run_tags', 'run_tags_idx');
        $dbh->bz_drop_index('test_run_tags', 'run_tags_user_idx');
        $dbh->bz_drop_index('test_tags', 'AI_tag_id');
        $dbh->bz_drop_index('test_tags', 'tag_name');
        $dbh->bz_drop_index('test_tags', 'test_tag_name_idx');
        $dbh->bz_drop_index('test_tags', 'test_tag_name_indx');
        $dbh->bz_drop_index('test_runs', 'test_runs_summary_idx');
    
        $dbh->bz_add_index('test_attachment_data', 'test_attachment_data_primary_idx', ['attachment_id']);
        $dbh->bz_add_index('test_attachments', 'test_attachments_submitter_idx', ['submitter_id']);
        $dbh->bz_add_index('test_builds', 'build_milestone_idx', ['milestone']);
        $dbh->bz_add_index('test_builds', 'build_name_idx', ['name']);
        $dbh->bz_add_index('test_builds', 'build_prod_idx', {FIELDS => [qw(build_id product_id)], TYPE => 'UNIQUE'});
        $dbh->bz_add_index('test_builds', 'build_product_id_name_idx', {FIELDS => [qw(product_id name)], TYPE => 'UNIQUE'});
        $dbh->bz_add_index('test_case_attachments', 'test_case_attachments_primary_idx', ['attachment_id']);
        $dbh->bz_add_index('test_case_bugs', 'case_bugs_bug_id_idx', ['bug_id']);
        $dbh->bz_add_index('test_case_bugs', 'case_bugs_case_id_idx', ['case_id']);
        $dbh->bz_add_index('test_case_bugs', 'case_bugs_case_run_id_idx', ['case_run_id']);
        $dbh->bz_add_index('test_case_categories', 'category_name_idx_v2', ['name']);
        $dbh->bz_add_index('test_case_categories', 'category_product_id_name_idx', {FIELDS => [qw(product_id name)], TYPE => 'UNIQUE'});
        $dbh->bz_add_index('test_case_categories', 'category_product_idx', {FIELDS => [qw(category_id product_id)], TYPE => 'UNIQUE'});
        $dbh->bz_add_index('test_case_components', 'components_case_id_idx', {FIELDS => [qw(case_id component_id)], TYPE => 'UNIQUE'});
        $dbh->bz_add_index('test_case_components', 'components_component_id_idx', ['component_id']);
        $dbh->bz_add_index('test_case_dependencies', 'case_dependencies_blocked_idx', ['blocked']);
        $dbh->bz_add_index('test_case_dependencies', 'case_dependencies_primary_idx', {FIELDS => [qw(dependson blocked)], TYPE => 'UNIQUE'});
        $dbh->bz_add_index('test_case_plans', 'test_case_plans_case_idx', [qw(case_id)]);
        $dbh->bz_add_index('test_case_plans', 'test_case_plans_primary_idx', {FIELDS => [qw(plan_id case_id)], TYPE => 'UNIQUE'});
        $dbh->bz_add_index('test_case_runs', 'case_run_build_env_idx', {FIELDS => [qw(run_id case_id build_id environment_id)], TYPE => 'UNIQUE'});
        $dbh->bz_add_index('test_case_runs', 'case_run_build_idx_v2', ['build_id']);
        $dbh->bz_add_index('test_case_runs', 'case_run_env_idx_v2', ['environment_id']);
        $dbh->bz_add_index('test_case_runs', 'case_run_status_idx', ['case_run_status_id']);
        $dbh->bz_add_index('test_case_runs', 'case_run_text_ver_idx', ['case_text_version']);
        $dbh->bz_add_index('test_case_runs', 'case_run_priority_idx', ['priority_id']);
        $dbh->bz_add_index('test_cases', 'test_case_requirement_idx', ['requirement']);
        $dbh->bz_add_index('test_cases', 'test_case_status_idx', ['case_status_id']);
        $dbh->bz_add_index('test_cases', 'test_case_tester_idx', ['default_tester_id']);
        $dbh->bz_add_index('test_case_tags', 'case_tags_case_id_idx_v3', [qw(case_id)]);
        $dbh->bz_add_index('test_case_tags', 'case_tags_primary_idx', {FIELDS => [qw(tag_id case_id userid)], TYPE => 'UNIQUE'});
        $dbh->bz_add_index('test_case_tags', 'case_tags_secondary_idx', {FIELDS => [qw(tag_id case_id)], TYPE => 'UNIQUE'});
        $dbh->bz_add_index('test_case_tags', 'case_tags_userid_idx', [qw(userid)]);
        $dbh->bz_add_index('test_email_settings', 'test_email_setting_user_id_idx', {FIELDS => [qw(userid relationship_id eventid)], TYPE => 'UNIQUE'});
        $dbh->bz_add_index('test_environment_category', 'test_environment_category_key1', {FIELDS => [qw(env_category_id product_id)], TYPE => 'UNIQUE'});
        $dbh->bz_add_index('test_environment_category', 'test_environment_category_key2', {FIELDS => [qw(product_id name)], TYPE => 'UNIQUE'});
        $dbh->bz_add_index('test_environment_element', 'test_environment_element_key1', {FIELDS => [qw(element_id env_category_id)], TYPE => 'UNIQUE'},);
        $dbh->bz_add_index('test_environment_element', 'test_environment_element_key2', {FIELDS => [qw(env_category_id name)], TYPE => 'UNIQUE'});
        $dbh->bz_add_index('test_environment_map', 'test_environment_map_key3', {FIELDS => [qw(environment_id element_id property_id)], TYPE => 'UNIQUE'});
        $dbh->bz_add_index('test_environment_property', 'test_environment_property_key1', {FIELDS => [qw(property_id element_id)], TYPE => 'UNIQUE'});
        $dbh->bz_add_index('test_environment_property', 'test_environment_property_key2', {FIELDS => [qw(element_id name)], TYPE => 'UNIQUE'});
        $dbh->bz_add_index('test_environments', 'environment_name_idx_v2', ['name']);
        $dbh->bz_add_index('test_environments', 'test_environments_key1', {FIELDS => [qw(environment_id product_id)], TYPE => 'UNIQUE'});
        $dbh->bz_add_index('test_environments', 'test_environments_key2', {FIELDS => [qw(product_id name)], TYPE => 'UNIQUE'});
        $dbh->bz_add_index('test_named_queries', 'test_namedquery_primary_idx', {FIELDS => [qw(userid name)], TYPE => 'UNIQUE'});
        $dbh->bz_add_index('test_plan_activity', 'plan_activity_changed_idx', ['changed']);
        $dbh->bz_add_index('test_plan_activity', 'plan_activity_field_idx', ['fieldid']);
        $dbh->bz_add_index('test_plan_activity', 'plan_activity_primary_idx', ['plan_id']);
        $dbh->bz_add_index('test_plan_attachments', 'test_plan_attachments_primary_idx', ['attachment_id']);
        $dbh->bz_add_index('test_plan_permissions', 'testers_plan_grant_idx', ['grant_type']);
        $dbh->bz_add_index('test_plan_tags', 'plan_tags_plan_id_idx', [qw(plan_id)]);
        $dbh->bz_add_index('test_plan_tags', 'plan_tags_primary_idx', {FIELDS => [qw(tag_id plan_id userid)], TYPE => 'UNIQUE'});
        $dbh->bz_add_index('test_plan_tags', 'plan_tags_secondary_idx', {FIELDS => [qw(tag_id plan_id)], TYPE => 'UNIQUE'});
        $dbh->bz_add_index('test_plan_tags', 'plan_tags_userid_idx', [qw(userid)]);
        $dbh->bz_add_index('test_run_activity', 'run_activity_field_idx', ['fieldid']);
        $dbh->bz_add_index('test_run_cc', 'test_run_cc_primary_idx', {FIELDS => [qw(run_id who)], TYPE => 'UNIQUE'});
        $dbh->bz_add_index('test_run_cc', 'test_run_cc_who_idx', [qw(who)]);
        $dbh->bz_add_index('test_runs', 'test_run_build_idx', ['build_id']);
        $dbh->bz_add_index('test_runs', 'test_run_env_idx', ['environment_id']);
        $dbh->bz_add_index('test_runs', 'test_run_plan_id_run_id_idx', [qw(plan_id run_id)]);
        $dbh->bz_add_index('test_runs', 'test_run_plan_ver_idx', ['plan_text_version']);
        $dbh->bz_add_index('test_runs', 'test_run_tester_idx', ['default_tester_id']);
        $dbh->bz_add_index('test_run_tags', 'run_tags_primary_idx', {FIELDS => [qw(tag_id run_id userid)], TYPE => 'UNIQUE'});
        $dbh->bz_add_index('test_run_tags', 'run_tags_run_id_idx', [qw(run_id)]);
        $dbh->bz_add_index('test_run_tags', 'run_tags_secondary_idx', {FIELDS => [qw(tag_id run_id)], TYPE => 'UNIQUE'});
        $dbh->bz_add_index('test_run_tags', 'run_tags_userid_idx', [qw(userid)]);
        $dbh->bz_add_index('test_tags', 'test_tag_name_idx_v2', [qw(tag_name)]);
        
        populateMiscTables();
        populateEnvTables();
        migrateEnvData();
    }
    
    sub updateACLs {
        my $dbh = Bugzilla->dbh;
        return unless $dbh->selectrow_array("SELECT COUNT(*) FROM test_plan_permissions") == 0;
    
        print "Populating test plan ACLs ...\n";
        my $ref = $dbh->selectall_arrayref("SELECT plan_id, author_id FROM test_plans", {'Slice' =>{}});
        foreach my $plan (@$ref){
            my ($finished) = $dbh->selectrow_array(
                "SELECT COUNT(*) FROM test_plan_permissions
                  WHERE plan_id = ? AND userid = ?",
                  undef, ($plan->{'plan_id'}, $plan->{'author_id'}));
            next if ($finished);
            $dbh->do("INSERT INTO test_plan_permissions(userid, plan_id, permissions)
                      VALUES(?,?,?)",
                      undef, ($plan->{'author_id'}, $plan->{'plan_id'}, 15));
        }
    }
    
    sub migrateAttachments {
        my $dbh = Bugzilla->dbh;
        return unless $dbh->bz_column_info('test_attachments', 'case_id');
        print "Migrating attachments...\n";
    
        my $rows = $dbh->selectall_arrayref(
            "SELECT attachment_id, case_id, plan_id
               FROM test_attachments", {'Slice' => {}});
    
        foreach my $row (@$rows){
            if ($row->{'case_id'}){
                $dbh->do("INSERT INTO test_case_attachments (attachment_id, case_id)
                          VALUES (?,?)", undef, ($row->{'attachment_id'}, $row->{'case_id'}));
            }
            elsif ($row->{'plan_id'}){
                $dbh->do("INSERT INTO test_plan_attachments (attachment_id, plan_id)
                          VALUES (?,?)", undef, ($row->{'attachment_id'}, $row->{'plan_id'}));
            }
        }
        $dbh->bz_drop_column('test_attachments', 'case_id');
        $dbh->bz_drop_column('test_attachments', 'plan_id');
    }
    
    sub populateMiscTables {
        my $dbh = Bugzilla->dbh;
        
        # Fix and add values to an existing intall. 
    
        $dbh->do("INSERT INTO test_case_run_status (name, sortkey) VALUES ('ERROR', 7)") 
          if $dbh->selectrow_array("SELECT COUNT(*) FROM test_case_run_status") 
            && ! $dbh->selectrow_array("SELECT COUNT(*) FROM test_case_run_status WHERE name = ?", undef, 'ERROR');
        $dbh->do("INSERT INTO test_fielddefs (name, description, table_name) VALUES ('target_pass', 'Target Pass Rate', 'test_runs')") 
          if $dbh->selectrow_array("SELECT COUNT(*) FROM test_fielddefs") 
            && ! $dbh->selectrow_array("SELECT COUNT(*) FROM test_fielddefs WHERE name = ?", undef, 'target_pass');
        $dbh->do("INSERT INTO test_fielddefs (name, description, table_name) VALUES ('target_completion', 'Target Completion Rate', 'test_runs')") 
          if $dbh->selectrow_array("SELECT COUNT(*) FROM test_fielddefs") 
            && ! $dbh->selectrow_array("SELECT COUNT(*) FROM test_fielddefs WHERE name = ?", undef, 'target_completion');
        $dbh->do("UPDATE test_environment_map SET property_id = ? where property_id = ?",undef, undef, 0);
        
        if ($dbh->selectrow_array("SELECT COUNT(*) FROM test_case_run_status")){
            $dbh->do("UPDATE test_case_run_status SET name='IDLE', sortkey=1 where case_run_status_id=1");
            $dbh->do("UPDATE test_case_run_status SET name='PASSED', sortkey=4 where case_run_status_id=2");
            $dbh->do("UPDATE test_case_run_status SET name='FAILED', sortkey=5 where case_run_status_id=3");
            $dbh->do("UPDATE test_case_run_status SET name='RUNNING', sortkey=2 where case_run_status_id=4");
            $dbh->do("UPDATE test_case_run_status SET name='PAUSED', sortkey=3 where case_run_status_id=5");
            $dbh->do("UPDATE test_case_run_status SET name='BLOCKED', sortkey=6 where case_run_status_id=6");
            $dbh->do("UPDATE test_case_run_status SET name='ERROR', sortkey=7 where case_run_status_id=7");        
        }
    
        # Insert initial values in static tables. Going out on a limb and
        # assuming that if one table is empty, they all are.
        return if $dbh->selectrow_array("SELECT COUNT(*) FROM test_case_status");
    
        print "Populating test_case_run_status table ...\n";
        print "Populating test_case_status table ...\n";
        print "Populating test_plan_types table ...\n";
        print "Populating test_fielddefs table ...\n";
    
        $dbh->do("INSERT INTO test_case_run_status (name, sortkey) VALUES ('IDLE', 1)");
        $dbh->do("INSERT INTO test_case_run_status (name, sortkey) VALUES ('PASSED', 4)");
        $dbh->do("INSERT INTO test_case_run_status (name, sortkey) VALUES ('FAILED', 5)");
        $dbh->do("INSERT INTO test_case_run_status (name, sortkey) VALUES ('RUNNING', 2)");
        $dbh->do("INSERT INTO test_case_run_status (name, sortkey) VALUES ('PAUSED', 3)");
        $dbh->do("INSERT INTO test_case_run_status (name, sortkey) VALUES ('BLOCKED', 6)");
        $dbh->do("INSERT INTO test_case_run_status (name, sortkey) VALUES ('ERROR', 7)");
        $dbh->do("INSERT INTO test_case_status (name) VALUES ('PROPOSED')");
        $dbh->do("INSERT INTO test_case_status (name) VALUES ('CONFIRMED')");
        $dbh->do("INSERT INTO test_case_status (name) VALUES ('DISABLED')");
        $dbh->do("INSERT INTO test_plan_types (name) VALUES ('Unit')");
        $dbh->do("INSERT INTO test_plan_types (name) VALUES ('Integration')");
        $dbh->do("INSERT INTO test_plan_types (name) VALUES ('Function')");
        $dbh->do("INSERT INTO test_plan_types (name) VALUES ('System')");
        $dbh->do("INSERT INTO test_plan_types (name) VALUES ('Acceptance')");
        $dbh->do("INSERT INTO test_plan_types (name) VALUES ('Installation')");
        $dbh->do("INSERT INTO test_plan_types (name) VALUES ('Performance')");
        $dbh->do("INSERT INTO test_plan_types (name) VALUES ('Product')");
        $dbh->do("INSERT INTO test_plan_types (name) VALUES ('Interoperability')");
        $dbh->do("INSERT INTO test_fielddefs (name, description, table_name) VALUES ('isactive', 'Archived', 'test_plans')");
        $dbh->do("INSERT INTO test_fielddefs (name, description, table_name) VALUES ('name', 'Plan Name', 'test_plans')");
        $dbh->do("INSERT INTO test_fielddefs (name, description, table_name) VALUES ('type_id', 'Plan Type', 'test_plans')");
        $dbh->do("INSERT INTO test_fielddefs (name, description, table_name) VALUES ('case_status_id', 'Case Status', 'test_cases')");
        $dbh->do("INSERT INTO test_fielddefs (name, description, table_name) VALUES ('category_id', 'Category', 'test_cases')");
        $dbh->do("INSERT INTO test_fielddefs (name, description, table_name) VALUES ('priority_id', 'Priority', 'test_cases')");
        $dbh->do("INSERT INTO test_fielddefs (name, description, table_name) VALUES ('summary', 'Run Summary', 'test_cases')");
        $dbh->do("INSERT INTO test_fielddefs (name, description, table_name) VALUES ('isautomated', 'Automated', 'test_cases')");
        $dbh->do("INSERT INTO test_fielddefs (name, description, table_name) VALUES ('alias', 'Alias', 'test_cases')");
        $dbh->do("INSERT INTO test_fielddefs (name, description, table_name) VALUES ('requirement', 'Requirement', 'test_cases')");
        $dbh->do("INSERT INTO test_fielddefs (name, description, table_name) VALUES ('script', 'Script', 'test_cases')");
        $dbh->do("INSERT INTO test_fielddefs (name, description, table_name) VALUES ('arguments', 'Argument', 'test_cases')");
        $dbh->do("INSERT INTO test_fielddefs (name, description, table_name) VALUES ('product_id', 'Product', 'test_plans')");
        $dbh->do("INSERT INTO test_fielddefs (name, description, table_name) VALUES ('default_product_version', 'Default Product Version', 'test_plans')");
        $dbh->do("INSERT INTO test_fielddefs (name, description, table_name) VALUES ('environment_id', 'Environment', 'test_runs')");
        $dbh->do("INSERT INTO test_fielddefs (name, description, table_name) VALUES ('product_version', 'Product Version', 'test_runs')");
        $dbh->do("INSERT INTO test_fielddefs (name, description, table_name) VALUES ('build_id', 'Default Build', 'test_runs')");
        $dbh->do("INSERT INTO test_fielddefs (name, description, table_name) VALUES ('plan_text_version', 'Plan Text Version', 'test_runs')");
        $dbh->do("INSERT INTO test_fielddefs (name, description, table_name) VALUES ('manager_id', 'Manager', 'test_runs')");
        $dbh->do("INSERT INTO test_fielddefs (name, description, table_name) VALUES ('default_tester_id', 'Default Tester', 'test_cases')");
        $dbh->do("INSERT INTO test_fielddefs (name, description, table_name) VALUES ('stop_date', 'Stop Date', 'test_runs')");
        $dbh->do("INSERT INTO test_fielddefs (name, description, table_name) VALUES ('summary', 'Run Summary', 'test_runs')");
        $dbh->do("INSERT INTO test_fielddefs (name, description, table_name) VALUES ('notes', 'Notes', 'test_runs')");
    }
    
    sub populateEnvTables {
        my $dbh = Bugzilla->dbh;
    
        my $sth;
        my $ary_ref;
        my $value;
    
        return unless $dbh->selectrow_array("SELECT COUNT(*) FROM test_environment_category") == 0;
        if ($dbh->selectrow_array("SELECT COUNT(*) FROM test_environment_element") != 0) {
            print STDERR "\npopulateEnv: Fatal Error: test_environment_category " .
                "is empty but\ntest_environment_element is not. This ought " .
                "to be impossible.\n\n";
            return;
        }
    
        $dbh->bz_start_transaction();
    
        print "Populating test_environment_category table ...\n";
        $dbh->do("INSERT INTO test_environment_category (product_id, name) " .
                 "VALUES (0, 'Operating System')");
        $dbh->do("INSERT INTO test_environment_category (product_id, name) " .
                 "VALUES (0, 'Hardware')");
    
        print "Populating test_environment_element table ...\n";
        $sth = $dbh->prepare("INSERT INTO test_environment_element " .
            "(env_category_id, name, parent_id, isprivate) " .
            "VALUES (?, ?, ?, ?)");
        $ary_ref = $dbh->selectcol_arrayref("SELECT value FROM op_sys");
        foreach $value (@$ary_ref) {
            $sth->execute(1, $value, 0, 0);
        }
        $ary_ref = $dbh->selectcol_arrayref("SELECT value FROM rep_platform");
        foreach $value (@$ary_ref) {
            $sth->execute(2, $value, 0, 0);
        }
    
        $dbh->bz_commit_transaction();
    }
    
    sub migrateEnvData {
        my $dbh = Bugzilla->dbh;
        my $sth;
        my $value;
        my $os_mapping;
        my $platform_mapping;
        my $ary_ref;
        my $i;
    
        return unless $dbh->bz_column_info('test_environments', 'op_sys_id');
    
        # Map between IDs in op_sys table and IDs in
        # test_environment_element table.
        $os_mapping = $dbh->selectall_hashref("SELECT " .
            "os.id AS op_sys_id, " .
            "env_elem.element_id AS element_id " .
            "FROM op_sys os, test_environment_element env_elem " .
            "WHERE os.value = env_elem.name " .
            "AND env_elem.env_category_id = 1",
            'op_sys_id');
    
        # Map between IDs in rep_platform table and IDs in
        # test_environment_element table.
        $platform_mapping = $dbh->selectall_hashref("SELECT " .
            "platform.id AS rep_platform_id, " .
            "env_elem.element_id AS element_id " .
            "FROM rep_platform platform, test_environment_element env_elem " .
            "WHERE platform.value = env_elem.name " .
            "AND env_elem.env_category_id = 2",
            'rep_platform_id');
    
        $dbh->bz_start_transaction();
        print "Migrating data from test_environments to test_environment_map ...\n";
        $sth = $dbh->prepare("INSERT INTO test_environment_map " .
            "(environment_id, property_id, element_id, value_selected) " .
            "VALUES (?, ?, ?, ?)");
        $ary_ref = $dbh->selectall_arrayref("SELECT environment_id, op_sys_id " .
            "FROM test_environments");
        foreach $i (@$ary_ref) {
            $sth->execute(@$i[0], 0, $os_mapping->{@$i[1]}->{'element_id'}, '');
        }
        $ary_ref = $dbh->selectall_arrayref("SELECT environment_id, rep_platform_id " .
            "FROM test_environments");
        foreach $i (@$ary_ref) {
            $sth->execute(@$i[0], 0, $platform_mapping->{@$i[1]}->{'element_id'}, '');
        }
        $dbh->bz_commit_transaction();
    
        print "Saving data from test_environments.xml column into text files ...\n";
        $ary_ref = $dbh->selectall_arrayref("SELECT environment_id, name, xml " .
            "FROM test_environments WHERE xml != ''");
        foreach $value (@$ary_ref) {
            open(FH, ">environment_" . @$value[0] . "_xml.txt");
            print FH "environment ID: @$value[0]\n";
            print FH "environment name: @$value[1]\n";
            print FH "environment xml:\n@$value[2]\n";
            close(FH);
        }
    
        $dbh->bz_drop_column('test_environments', 'op_sys_id');
        $dbh->bz_drop_column('test_environments', 'rep_platform_id');
        $dbh->bz_drop_column('test_environments', 'xml');
    }
    
    sub fixTables {
        my $dbh = Bugzilla->dbh;
    
        # Fix test_case_bugs table so that all case_id fields are not null.
        my ($count) = $dbh->selectrow_array("SELECT COUNT(*) FROM test_case_bugs WHERE case_id IS NULL");
        if ($count){
            require Bugzilla::Extension::Testopia::TestCaseRun;
            my $caseruns = $dbh->selectcol_arrayref("SELECT case_run_id FROM test_case_bugs WHERE case_id IS NULL");
            my $sth = $dbh->prepare_cached("UPDATE test_case_bugs SET case_id = ? WHERE case_run_id = ?");
            foreach my $cr (@$caseruns){
                my $caserun = Bugzilla::Extension::Testopia::TestCaseRun->new($cr);
                $sth->execute($caserun->case->id, $cr);
            }
        }
    
        # If we can't add a unique index to (case_id,component_id), then we
        # need to remove duplicate rows from test_case_components.
        eval{
            $dbh->bz_add_index('test_case_components', 'components_case_id_idx', {FIELDS => [qw(case_id component_id)], TYPE => 'UNIQUE'});
        };
        if ($@){
            print "Running component fix...\n";
            my $rows = $dbh->selectall_arrayref("SELECT * FROM test_case_components", {"Slice" => {}});
            my $seen;
            foreach my $row (@$rows){
              my $line = $row->{'case_id'} . "-" . $row->{'component_id'};
              if (!$seen->{$line}){
                 $seen->{$line} = 'seen';
              }
              elsif ($seen->{$line} eq 'seen'){
                  $dbh->do("DELETE FROM test_case_components
                            WHERE case_id = ? AND component_id = ?",
                            undef, ($row->{'case_id'}, $row->{'component_id'}));
                  $dbh->do("INSERT INTO test_case_components
                            VALUES(?,?)",
                            undef, ($row->{'case_id'}, $row->{'component_id'}));
                  $seen->{$line} = 'fixed';
              }
              elsif ($seen->{$line} eq 'fixed'){
                  next;
              }
            }
        }
    }
    
    sub createGroup {
        Bugzilla::Group->create({
            name        => 'Testers',
            description => 'Can read and write all test plans, runs, and cases.',
            isbuggroup  => 0 }) unless new Bugzilla::Group({name => 'Testers'});
    }
    
    # A spot for fixing stuff at the very end.
    sub finalFixups {
        my $dbh = Bugzilla->dbh;
    
        # We added the estimated_time field later, so we can't add it
        # inside populateMiscTables().
        unless ($dbh->selectrow_array("SELECT COUNT(*) FROM test_fielddefs " .
                "WHERE name = 'estimated_time'")) {
            $dbh->do("INSERT INTO test_fielddefs (name, description, table_name) " .
                    "VALUES ('estimated_time', 'Estimated Time', 'test_cases')");
        }
        if ($dbh->selectrow_array("SELECT COUNT(*) FROM test_case_runs WHERE priority_id = 0")){
            print "Updating case_run priorities...\n";
            my $cases = $dbh->selectall_arrayref("SELECT case_id, priority_id FROM test_cases",{'Slice'=>{}});
            my $sth = $dbh->prepare_cached("UPDATE test_case_runs SET priority_id = ? WHERE case_id = ?");
            foreach my $c (@$cases){
                $sth->execute($c->{priority_id},$c->{case_id})
            }
            # Anything left over should get the default priority
            $dbh->do("UPDATE test_case_runs 
                         SET priority_id = (SELECT id 
                                              FROM priority 
                                             WHERE value = ?) 
                       WHERE priority_id = 0", undef, Bugzilla->params->{defaultpriority});
        }
    }
}

sub post_bug_after_creation {
    my ($self, $args) = @_;
    
    
    my $vars = $args->{vars};
    my $cgi = Bugzilla->cgi;
    
    my $caserun_id = $cgi->param('caserun_id');
    my $case_id = $cgi->param('case_id'); 
    if (detaint_natural($caserun_id)) {
        my $caserun = Bugzilla::Extension::Testopia::TestCaseRun->new($cgi->param('caserun_id'));
        ThrowUserError("invalid-test-id-non-existent", {'id' => $caserun_id, 'type' => 'Case-Run'}) unless $caserun;
        ThrowUserError("testopia-read-only", {'object' => $caserun}) unless $caserun->canedit;
        
        $caserun->attach_bug($vars->{'id'});
    
        $vars->{'caserun'} = $caserun;
    }
    elsif (detaint_natural($case_id)) {
        my $case = Bugzilla::Extension::Testopia::TestCase->new($cgi->param('case_id'));
        ThrowUserError("invalid-test-id-non-existent", {'id' => $case_id, 'type' => 'Case'}) unless $case;
        ThrowUserError("testopia-read-only", {'object' => $case}) unless $case->canedit;
        
        $case->attach_bug($vars->{'id'});
    
        $vars->{'case'} = $case;
    }
    
}

sub product_confirm_delete {
    my ($self, $args) = @_;
    
    
    
    my $vars = $args->{vars};
    
    $vars->{'testopia_product'} = new Bugzilla::Extension::Testopia::Product($vars->{product}->id);
}

sub webservice {
    my ($self, $args) = @_;
    
    my $dispatch = $args->{dispatch};
    
    $dispatch->{TestPlan}    = "Bugzilla::Extension::Testopia::WebService::TestPlan";
    $dispatch->{TestCase}    = "Bugzilla::Extension::Testopia::WebService::TestCase";
    $dispatch->{TestRun}     = "Bugzilla::Extension::Testopia::WebService::TestRun";
    $dispatch->{TestCaseRun} = "Bugzilla::Extension::Testopia::WebService::TestCaseRun";
    $dispatch->{Environment} = "Bugzilla::Extension::Testopia::WebService::Environment";
    $dispatch->{Build}       = "Bugzilla::Extension::Testopia::WebService::Build";
    $dispatch->{Testopia}    = "Bugzilla::Extension::Testopia::WebService::Testopia";
    $dispatch->{TestopiaUser} = "Bugzilla::Extension::Testopia::WebService::User";
    $dispatch->{TestopiaProduct} = "Bugzilla::Extension::Testopia::WebService::Product";
}



__PACKAGE__->NAME;
