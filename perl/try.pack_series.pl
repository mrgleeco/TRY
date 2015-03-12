#!/usr/bin/env perl
#
#
use JSON::XS;

# estimate: max = events per day
my $max;
$max = 17280;     # 5 seconds 
$max = 288;     # 5 minutes
$max = 1440;     # 1 minute

my @a;
push @a, int rand 1024
    for 1..$max;

# test: working with quads? this didn't pan out..
#my $tmpl = 'Q*'
my $tmpl = 'S*';
my $x = pack $tmpl, @a;      # 2384 bytes;  672 bytes gzipd
my @z = unpack $tmpl, $x;

=cut
my $uenc = pack 'u*', $x;
my ($fh,$f) = (undef,"tmp.$$");
open ($fh, '>', $f) || die;
print $fh $uenc;
close $fh;
my $zenc = qx{ cat $f | gzip  };
# my $zenc = '';
=cut


use Compress::LZ4;

my $lz = compress($x);
my $lzu = decompress($lz);


my $json = JSON::XS->new->encode(\@z || []);     # 1129 bytes; 570 bytes gzipd
my $gz = qx{ echo "$json" | gzip };
my $enc = qx{ echo "$json" | gzip  | base64 };

printf( "Array tests A \t max=%d \n", $max);

printf( "pack format %s\t length=%d\n", $tmpl, length $x);
#printf( "uuencode length=%d\n", length $uenc);
#printf( "uuencode + gzip length=%d\n", length $zenc);
printf( "lz4 length=%d\n", length $lz);


$lz = compress_hc($json);
printf( "lz4 json length=%d\n", length $lz);

printf( "len: %d \t%s\n", length $json , 'raw json', );
printf( "len: %d \t%s\n", length $gz, 'gzip json', );
printf( "len: %d \t%s\n", length $enc, 'gzip json + base64', );

# test: double array; [ts,val] deltas
my @b = [ int rand 1024, int rand 1024 ];
push @b, [
    $b[$#b][0] - int rand 1024,
    $b[$#b][1] - int rand 1024
]
    for 1..$max;

$json = JSON::XS->new->encode(\@b || []);     # 1129 bytes; 570 bytes gzipd
$gz = qx{ echo "$json" | gzip };
$enc = qx{ echo "$json" | gzip | base64 };
# print JSON::XS->new->encode(\@b || []);     # 1129 bytes; 570 bytes gzipd

printf( "Array tests B: [tdelta,valdelta] max=%d\n", $max);
printf( "len: %d \t%s\n", length $json , 'raw json', );
printf( "len: %d \t%s\n", length $gz, 'gzip json', );
printf( "len: %d \t%s\n", length $enc, 'gzip json + base64', );



__END__

Array tests A    max=288
len: 1125   raw json
len: 565    gzip json
len: 757    gzip json + base64
Array tests B: [tdelta,valdelta] max=288
len: 4734   raw json
len: 1977   gzip json


Array tests A    max=1440
len: 5635   raw json
len: 2638   gzip json
len: 3521   gzip json + base64

Array tests B: [tdelta,valdelta] max=1440
len: 25504  raw json
len: 10314  gzip json
len: 13753  gzip json + base64
