#
#
# vim: ft=perl
# 
# joke: json ordered K encoding
#  json ordered ken encoding
# whY? 
#   for a given visitor, we want to represent the users events as raw log lines.  
#       but for a given user, 
#           * high repitition of data, eg. same hostname, same URI, same http.status code
#   json is light, 
#   arrays are the lightest data structure
#   log lines as arrays
#   but in a compression setting, for large storage of small items (ie. individual users )
#   use of an integer 
#
# use common::sense;
# use JSON::XS        ();

use warnings;
use Benchmark;
use Data::Dumper;
use Digest::MD5     qw( md5_hex );

use JSON::XS;
use Time::HiRes     qw(gettimeofday);

#sub _warns {  print STDERR $_[0],"\n", ( ref $_[1] )? Dumper( [ $_[1] ]) : '' };
sub _warns {  print STDERR $_[0],"\n", ( ref $_[1] )? JSON::XS->new->canonical->pretty->encode( $_[1]) : ''};

my ($data, $stat);

use constant {
    DEBUG       => $ENV{DEBUG} || 0,
};

my @IN;

=cut

my @IN = (

    [ time,         'GET',  'www.example.com',  '/bingo-puppy',  '', '' ],
    [ time - 5,      'GET',  'www.example.com',  '/bingo-lassie',  '', '' ],
    [ time - 10,      'GET',  'www.example.com',  '/bingo',  '', '' ],
    [ time - 20,     'GET',  'www.example.com',  '/bb',  '', '' ],
    [ time - 30,     'GET',  'www.example.com',  '/',  'bing.com', 'dogs' ],
);

=cut


my @KW      = ( (undef) x 10, qw( email passwords bingo chess star+wars+action+figures someReallyLongKeywordString ) );
my @ZONE    = qw( example.com sports.com go.com areallylongassdomain.com xxxyyzz.com www.example.com www.cool.org );
my @URI     = qw( / /  /foo /bar /foo/bar/baz /roboto.txt  /chat.html /view/404-error.html );
my @REF     = ( (undef) x 10, qw( bing.com google.com yahoo.com digg.com hx0r.com ) ); 
my $MAX     = 100_000;


sub build_input {
    my $max = shift;
    for (1..$max ){ 
        push @IN, [
            $_ == 1 ?  1329153264 : 1329153264 - int ($_ * 1.5 ),
            'GET',
            $ZONE[ int rand $#ZONE],
            $URI[ int rand $#URI] || '',
            $REF[ int rand $#REF] || '',
            $KW[ int rand $#KW] || '',
        ];
    }
}


#
#
#
sub main {
    my $o  = shift;

    my ($str_in,$str_out);
    build_input($o->{max} || 1000);

    $stat->{ts_init}            = gettimeofday;
    for (@IN){
        $stat->{in_row_ct}++;
        map { $stat->{sum_byte_ct}+= length $_ } @{$_};     
        $str_in .= $_ for @$_;
    }
    $stat->{ts_run_raw}            =  sprintf "%2.4f", gettimeofday - $stat->{ts_init};
    $stat->{avg_row_byte_ct} = sprintf "%2.2f", $stat->{sum_byte_ct} / $stat->{in_row_ct};


    $stat->{ts_init}            = gettimeofday;
    my $enc = encode_log(\@IN); 
    $stat->{ts_run_enc}         = sprintf "%2.4f", gettimeofday - $stat->{ts_init};


    my $str =  JSON::XS->new->encode( $enc);
    $stat->{json_byte_ct}+= length $str;


    $stat->{enc_row_ct}         = scalar @$enc;
    for ( @$enc ) { 
        map { $stat->{enc_byte_ct}+= length $_ } @{$_};     
    }

    DEBUG and  _warns("ENC", $enc );

    print JSON::XS->new->encode( $enc);


    

    $stat->{ts_init}            = gettimeofday;
    my $dec  = decode_log($enc );
    $stat->{ts_run_dec}         = sprintf "%2.4f", gettimeofday - $stat->{ts_init};

    $stat->{dec_row_ct}         = scalar @$dec;

    for ( @$dec ) { 
        map { $stat->{dec_byte_ct}+= length $_ } @{$_};     
        $str_out .= $_ for @$_;
    }
    $stat->{md5_in} = md5_hex $str_in;
    $stat->{md5_out} = md5_hex $str_out;
    $stat->{md5_parity} = $stat->{md5_out} eq $stat->{md5_in}  ? 1 :0;



    DEBUG and _warns("DEC: ", $dec );

    $stat->{enc_ratio} = sprintf "%2.2f%%", 100 * ( 1 - ( $stat->{enc_byte_ct}/$stat->{dec_byte_ct}) );



    _warns("stats: ", $stat ) if $stat;

}

=cut
=cut

sub encode_log {
    my $in  = shift; 
    my $o   = shift || {};

    @$in or ( _warns("no input array") and return);

    # newest->oldest always

    my ($out, $seen);

    my $col_max     = $#{ $in->[0] };
    
    unshift @$in,undef;              # metadata holder; keeps numbers sane too!

    for my $i (1..$#$in ){ 

        DEBUG > 1 and _warns( "ROW.$i  ". join( '|', @{$in->[$i]} ) );


        $out->[$i]->[0] = ( $i == 1 ) 
            ? $in->[$i]->[0]
            : $in->[$i-1]->[ 0 ] - $in->[$i]->[0];
        

        for my $c ( 1..$col_max ){ 
            
            my ($val,$tok) = ($in->[$i]->[$c], undef);

            if ($in->[$i]->[$c] eq '' or $in->[$i]->[$c] eq '0'){ 
                $out->[$i]->[$c] = 0;
                $tok = 0;
            }
            elsif (  $seen->[$c]->{ $in->[$i]->[$c] } ){
                 #$tok  = $seen->[$c]->{ $in->[$i]->[$c] };
                $out->[$i]->[$c] = 1 * $seen->[$c]->{ $in->[$i]->[$c] };
    
            }else{
                # string
                $tok = $in->[$i]->[$c];
                $seen->[$c]->{ $in->[$i]->[$c] } = $i;
                $out->[$i]->[$c] = $tok;
            }
            # $out->[$i]->[$c] = $tok;

        }
        
    }
    DEBUG   and _warns("SEEN: ", $seen );
    $out;
}





sub decode_log {
    my $in = shift or return;
    my ($out,$seen);

    # newest->oldest always
    #

    for my $i ( 1..$#$in ) {

        $out->[$i]->[0] = ( $i == 1 ) 
            ? $in->[$i]->[0]
            : $out->[$i-1]->[0] - $in->[$i]->[0];

        DEBUG > 1 and _warns( "ROW.$i decode input  ". join( '|', @{$in->[$i]} ) );

        for my $c (1..$#{ $in->[$i] } ){ 

            if ( $in->[$i]->[$c] eq '0' ){ 
                $out->[$i]->[$c] = '';
            } 
            elsif ( $in->[$i]->[$c] =~ /^(\d+)/   ){ 
                $out->[$i]->[$c] = $seen->[$c]->{ $1 };

            }else{ 
                $seen->[$c]->{ $i} = $in->[$i]->[$c];
                $out->[$i]->[$c] = $in->[$i]->[$c];
            }
        }
    }
    DEBUG > 1 and _warns( "SEEN: ", $seen );

    $out;
}


my $opt = { 
    max => $ARGV[0],
};

main($opt);


__END__


=cut


v.1 script (cols=time+4)
    rows    ratio       raw     enc     dec
    1k      82%         0.2ms   0.8ms   0.9ms
    10k     83%         2.4ms   7.4ms   8.3ms
    100k    81%         230ms   780ms   863ms

            'enc_ratio' => '81.54%',
            'ts_run_dec' => '0.8635',
            'avg_row_byte_ct' => '37.70',
            'dec_row_ct' => 100001,
            'md5_parity' => 1,
            'md5_out' => '9ac553e7cd12209303e4e67ee44e7b84',
            'dec_byte_ct' => 3770215,
            'sum_byte_ct' => 3770215,
            'ts_run_enc' => '0.7857',
            'ts_init' => '1329158815.73909',
            'enc_row_ct' => 100001,
            'md5_in' => '9ac553e7cd12209303e4e67ee44e7b84',
            'ts_run_raw' => '0.2298',
            'in_row_ct' => 100000,
            'enc_byte_ct' => 695962
          }
            'enc_ratio' => '82.92%',
            'ts_run_dec' => '0.0827',
            'avg_row_byte_ct' => '37.80',
            'dec_row_ct' => 10001,
            'md5_parity' => 1,
            'md5_out' => '2a06f44e4163ae1fc14f3d68606371c7',
            'dec_byte_ct' => 377971,
            'sum_byte_ct' => 377971,
            'ts_run_enc' => '0.0737',
            'ts_init' => '1329155738.19198',
            'enc_row_ct' => 10001,
            'md5_in' => '2a06f44e4163ae1fc14f3d68606371c7',
            'ts_run_raw' => '0.0242',
            'in_row_ct' => 10000,
            'enc_byte_ct' => 64563
          {
            'enc_ratio' => '81.84%',
            'ts_run_dec' => '0.0088',
            'avg_row_byte_ct' => '37.99',
            'dec_row_ct' => 1001,
            'md5_parity' => 1,
            'md5_out' => '21e43fe33d266a52b31805a0dab3c52f',
            'dec_byte_ct' => 37989,
            'sum_byte_ct' => 37989,
            'ts_run_enc' => '0.0081',
            'ts_init' => '1329158685.0274',
            'enc_row_ct' => 1001,
            'md5_in' => '21e43fe33d266a52b31805a0dab3c52f',
            'ts_run_raw' => '0.0024',
            'in_row_ct' => 1000,
            'enc_byte_ct' => 6897
          }
=cut



