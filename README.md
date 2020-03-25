# Testopia
Testopia is a test case management extension for Bugzilla. It is designed to be a generic tool for tracking test cases, allowing for testing organizations to integrate bug reporting with their test case run results. Though it is designed with software testing in mind, it can be used to track testing on virtually anything in the engineering process.

## Testopia 3.0 (not yet released)

If you upgraded to Bugzilla 5.0, you probably noticed that Testopia 2.5 is *not* compatible with this version. Despite Bugzilla 5.0 has already been released a few months ago, we don't plan to release a fix for Testopia immediately, because it's currently under heavy work to make Testopia a fully self-contained extension, which means that all tr_*.cgi scripts which are currently in the `bugzilla/` root directory are being moved into `extensions/Testopia/lib/`. This is [not a trivial task](https://bugzilla.mozilla.org/show_bug.cgi?id=743652), it takes time (it started in August 2014), and we decided that it was not a good idea to release half-baked code which still needs testing to make sure we didn't regress anything.

The good news is that the [current code in the git repository](https://github.com/bugzilla/extensions-Testopia) already works with Bugzilla 5.0, and so if you upgraded to 5.0 already, and if you don't mind having a work-in-progress extension on your machine, you can decide to pull the code from the git repository. This would also let us get some early feedback in case you find regressions.

If you find bugs in the code available from the git repository, please [report it to us](https://bugzilla.mozilla.org/enter_bug.cgi?product=Testopia&amp;component=General) so that we can fix most critical ones on time for Testopia 3.0. Do not ask when we plan to release 3.0, because we really don't know. "As soon as possible" is our best answer.

## Testopia 2.5

This version supports Bugzilla 4.2 and 4.4, and the best news is that it no longer requires a patch for Bugzilla. If you are upgrading, please reverse the existing version's patch before installing. A fresh install only requires that you untar the tarball in your Bugzilla root directory and run checksetup. Thanks go to LpSolit from the Bugzilla team for his work in making this possible.

## Testopia 2.4

This version supports Bugzilla 3.6.

**IMPORTANT NOTICE:** If you are upgrading on a case sensitive filesystem you must remove the existing `testopia` folder in the `extensions` directory. If you have made modifications to the Testopia source code, you will need to merge them into the new `Testopia` folder (capital T). If you are on Windows or another case insensitive file system you should first rename the folder (`testopia-old` for example) and then unzip the tarball. You can then merge your changes before deleting the old version.

**API USERS TAKE NOTE:** Positional parameters are now deprecated. All params should now be sent in a hash (struct, dict, hashmap or whatever your language of choice calls key, value pairs). Though all attempts have been made to provide continuing support for positional parameters, please be aware that some API calls may fail until you make this change. Also, future versions may remove this support completely.

As always please backup your installation before attempting to install or upgrade.

## Testopia 2.3

This version supports Bugzilla 3.4. The main new features are:

- Support XML export and import of test plans and children
- Support CSV export of test cases and results.
- New reports: worst offender and case roll-up
- Set priorities on indidual case-runs
- New clone options
- Uses the latest Extjs 3.0 library
- Converts Testopia into a true Bugzilla extension
- Numerous bug fixes

## Integration Points

- Testopia integrates with Bugzilla products, components, versions, and milestones to allow a single management interface for high level objects.
- Testopia allows users to login to one tool and uses Bugzilla group permissions to limit access to modifying test objects.
- Testopia allows users to attach bugs to test case run results for centralized management of the software engineering process.

## Requirements

As our development has moved forward, we have decided to try to keep abreast of the latest stable release from Bugzilla (currently 5.0). This gives us a stable code base to work from. Developing plugins or extensions for any software is like trying to hit a moving target. This decision allows us to focus our time more on releasing new features often and early rather than back porting. However, this means that most major feature will not be back ported to earlier versions unless and until we have time to do so. Anyone wishing to help in this effort is more than welcome.

- Bugzilla 4.x or higher
- Mysql 5.0 or PostgreSQL 8.3
- Additional Perl Modules: `Text::CSV` `XML::Schema::Validator` `XML::Schema::Parser` (for importer) and `JSON`

## TODO

- User preferences
- Notification emails
- More Reports

See the [Roadmap](http://wiki.mozilla.org/Testopia:Roadmap) and [Bug List](https://bugzilla.mozilla.org/buglist.cgi?quicksearch=prod%3DTestopia) for more details.

## Links

- [FAQ](http://wiki.mozilla.org/Testopia:FAQ)
- [Wiki](http://wiki.mozilla.org/Testopia)
- [Docs](http://git.mozilla.org/?p=bugzilla/extensions/Testopia.git;a=blob;f=extensions/Testopia/doc/Manual.pdf)
- [Bugs](https://bugzilla.mozilla.org/buglist.cgi?quicksearch=prod%3DTestopia) (Please read the [Bug Reporting Guide](https://wiki.mozilla.org/Testopia:Bug_Reporting_Guide))
- [Official Testopia Blog](http://testopia.blogspot.com/)
- IRC: `#testopia` or `#bugzilla` on irc.mozilla.org
- User Help: support-webtools@lists.mozilla.org
- Developers: dev-apps-webtools@lists.mozilla.org

## Downloads

- [Testopia 2.5 (Bugzilla 4.2)](https://ftp.mozilla.org/pub/mozilla.org/webtools/testopia/testopia-2.5-BUGZILLA-4.2.tar.gz)
- [Testopia 2.4 (Bugzilla 3.6 and 4.0)](https://ftp.mozilla.org/pub/mozilla.org/webtools/testopia/testopia-2.4-BUGZILLA-3.6.tar.gz)
- [Archived Versions](https://ftp.mozilla.org/pub/mozilla.org/webtools/testopia/)

## Developers
Ryan Wilson (former developer)  
Greg Hendricks (former developer)  
Vance Baarda (former developer)  
Ed Fuentetaja (former developer)  
