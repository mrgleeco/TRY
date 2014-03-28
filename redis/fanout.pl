


use JSON::XS;

my @az = ('a'..'z');
my @keylist = ( 'foo', 'bar', 'baz' );
my $h;

=cut
map  { 
    $h->{$_} = { map {  $_ => 1 } @keylist }
} @keylist;

=cut
my $t = time();
for my $i (1..4) { 
    map { 
    # with timestamp
    #$h->{$_}->{ $az[int rand $#az] } = [ $i, $t - int rand 3600]
    # without:
    $h->{$_}->{ $az[int rand $#az] } =  $i
    } @keylist;
}


print JSON::XS->new->pretty->encode($h);

#
# now the fan-out
#
my $z;
while(my($k,$e) = each %$h) {
    map { 
        push @$z, [$k,$_,$e->{$_}]
    } keys %$e;
}

print JSON::XS->new->pretty->encode($z);

print "series ct=", scalar keys %$h, "\n";
print "fanout ct=", scalar @$z, "\n";

print JSON::XS->new->pretty->encode(

    {
        results => [],
        debug => { 
            start_time => time,
            end_time => time() - 86400,
            duration => 86400,
            segment_ct => 288,
            runtime => 0.482
            
        
        }
    
    
    }


)

__END__

{
   "bar" : {
      "n" : 2,
      "p" : 1,
      "r" : 3,
      "t" : 4
   },
   "foo" : {
      "u" : 3,
      "m" : 4,
      "x" : 2,
      "o" : 1
   }
}
[
   [
      "bar",
      "n",
      2
   ],
   [
      "bar",
      "p",
      1
   ],
   [
      "bar",
      "r",
      3
   ],
   [
      "bar",
      "t",
      4
   ],
   [
      "foo",
      "u",
      3
   ],
   [
      "foo",
      "m",
      4
   ],
   [
      "foo",
      "x",
      2
   ],
   [
      "foo",
      "o",
      1
   ]
]
series ct=3
fanout ct=12
