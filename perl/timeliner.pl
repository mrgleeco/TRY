#!/usr/bin/env perl

# create a singular timeline for everything in a dir
# key is to parse as many timestamp looking lines as possible

use Date::Parse;

my $Timeline;
my ($meta,$data);

sub main {
    my @files = qx{ find . -type f -depth +0};
    for my $f (@files) {
        chomp $f;
        my @raw = $f =~ /gz$/ ? () :  qx{ cat "$f" };
        my $key = $f;
        $key =~ s!\s+!+!g;
        tally($key, \@raw);
    }
    print join("\t", qw(TOTAL PARSED COVERAGE FILE)),"\n";
    for my $f (sort { $meta->{$b}->{total} <=>  $meta->{$a}->{total} } keys %$meta) { 
        my $r = $meta->{$f};
        print join("\t", $r->{total}, $r->{parsed}, $r->{coverage}, $f), "\n";
    }
    print "\n\n";
    print $_
        for sort { $a cmp $b } @$Timeline;
}


sub tally {
    my ($file,$lines) = @_;

    my $ct = scalar @$lines;
    $meta->{$file}->{total}  = $ct;
    $meta->{$file}->{parsed} = 0;

    my $t_last;
    my $n = 0;
    while(my $line = shift @$lines) {
        my ($t,$date_str,$msec,$continued);

        if ( $line =~ m@^\[(\d{4,4}-\d{2,2}-\d{2,2}) (\d+:\d+:\d+),(\d+)\]@ ) {
            # ES log format  -- assume our systems are GMT (insideous assumptions!)
            # 2014-12-11 00:16:52,556 -> 2014-12-11T00:16:52.556Z
            $date_str = $1 .'T'.$2.'.'.$3.'Z';
            $t = str2time($date_str);
            # $line = "ESPaRSE $line";
        }
        elsif ( $line =~ m@\[(\d{2,2}.*?\d\d:\d\d\S+ \+\d+)\] @            # nxginx format
            || $line =~ m@\[?(\d{4,4}-\d{2,2}-\d{2,2}\S+?)\]? @         # winston(?) format
            || $line =~ m@^\w+\t(\d\d-[a-z]{3,3}-\d{4,4}.*?)\t@i        # bamboo format
        ) {
            $date_str = $1;
            $t = str2time($date_str);
        }
        elsif ($t_last) {
            $t = $t_last;
            $continued = "\t";
        }

        $t or next;
        ++$n;

        my $mark = sprintf("%.3f %04d", $t, $n);

        $meta->{$file}->{parsed}++;
        push @$Timeline,  join("\t", $mark, $file, $continued, $line);
        $t_last = $t;
    }
    $meta->{$file}->{coverage} = $meta->{$file}->{parsed} && $meta->{$file}->{total} ? sprintf("%d%%" , 100 * $meta->{$file}->{parsed} / $meta->{$file}->{total} ) : 0;
}

main();

__END__

########
Examples
########

# chef
[2014-10-06T14:23:29+00:00] INFO: Running start handlers

# bamboo (local TZ!)
build   06-Oct-2014 21:06:30    running bamboo process turd collector
simple  06-Oct-2014 21:06:30    Finished task 'Delete Environment' with result: Success

# ex. winston
2014-10-06T14:20:11.947Z - info: [service.auth] initializing service auth with configuration:
=========================================================

# nginx
54.69.215.27 - - [06/Oct/2014:14:21:29 +0000] "POST /api/v1/deployments HTTP/1.1" 201 45 "-" "python-requests/1.2.3 CPython/2.7.5 Linux/3.10.37-47.135.amzn1.x86_64" "-"

54.69.96.149 - - [06/Oct/2014:14:23:55 +0000] "GET /analytics.js HTTP/1.1" 200 335 "https://cam-cbt1029-uts-5.dev.jut.io/" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.94 Safari/537.36" "-"
