
=cut

Demo of router using named captures 

idea is a very simple and easy to use call
=cut

package Demo::Bake;

use Data::Dumper qw(Dumper);;

sub user {
    my ($o) = @_;
    print "user id=$o->{id}\n";
}

sub sex { 
    my ($o) = @_;
    print "sex=$o->{sex}\n";
}

Route::add('/user/_search', [qw(GET POST)], \&search);
Route::add('/user/:id', [qw(GET POST PUT)], \&user );
Route::add('/user/sex/:id/:sex', ["GET", "PUT"], \&user, \&sex, { id => { type => 'int', len => 5}} );
#print Dumper($Route::R);

# calling it
my($r,$o) = Route::find('GET', '/user/sex/12345/male');
$r and $r->run($o);

#print Dumper($r);
#print Dumper($o);


package Route;

use Data::Dumper qw(Dumper);;

our $R;

sub add {
    my $r = new Route(shift, ref $_[$#_]  eq 'HASH' ? pop : undef );
    $r->method(shift);
    $r->cb(@_);
    $R->{$r->uri} = $r;
}

sub new {
    my ($class,$u,$o) = @_;
    my $this = bless _route_prep($u,$o), $class;
    $this;
}

sub _route_prep {
    my $u = shift;
    my $o = shift || {};
    print "route opts";
    print Dumper($o);
    my @U = split('/', $u);
    my (@re, @arg);
    my  ($min,$max) = (1,65);   # TODO - dynamic 
    for (@U){
        if ( m!^:(\w+)! ){
            my $id = $1;
            my $s = $o->{$1} || {};
            my ($x,$y,$z) = ($s->{min_len} || $s->{len} || $min, $s->{len} || $max, $s->{type} || '');
            my $type = '[^/]';
            $type = '\d'   if ( $z eq 'int' );
            $type = '\w'   if ( $z eq 'string' );
            push @re, qq!(?<$id>$type! . qq!{$x,$y})!;    # use name captures
            push @arg, $1;
        }
        else{
            push @re, $_;
        }
    }
    # print Dumper(\@re);
    my $qre = join('/', @re);
    return { 
        uri     => $u,
        qre     => qr/^$qre$/,
        arg     => \@arg,
    }

}

sub foo {
    my $this = shift;
    $this->{foo} = shift if @_;
    $this->{foo};
}

#$ getters only - should NOT change over life of process

sub uri{
    my ($this) = @_;
    return $this->{uri};
}

sub qre{
    my ($this) = @_;
    return $this->{qre};
}
sub arg{
    my ($this) = @_;
    return $this->{arg}; 
}


sub method{
    my ($this,$arg) = @_;
    if (ref $arg eq 'ARRAY') { 
        $this->{method_list} = $arg;
        my $q = join('|', map { uc($_) } @$arg);
        $this->{method} = qr/^($q)$/;
    }elsif ($arg){
        my $q = uc($arg);
        $this->{method_list} = [ $q ];
        $this->{method} = qr/^($q)/;
    }
    return wantarray
        ? @{ $this->{method_list}}
        : $this->{method};
}

sub cb{
    my $this    = shift;
    push @{$this->{cb}},$_ for @_;
    return wantarray 
        ? @{ $this->{cb}}
        : $this->{cb};
}

sub find {
    my ($method,$uri) = @_;
    my $f;
    my %arg;
    for (grep { $method =~ $_->method() } values %$R){
        $uri    =~ $_->qre or next;
        $f      = $_;
        %arg    = map { $_ => $-{$_}[0] } keys %-;
    }
    return ($f, \%arg);
}


sub run {
    my ($this,$o) = @_;
    warn "running?";
    print Dumper($_) for $this->cb;
    $_->($o) for $this->cb;

}



1;

__END__

$VAR1 = bless( {
                 'arg' => [
                            'id',
                            'sex'
                          ],
                 'qre' => qr/(?-xism:^\/user\/sex\/(?<id>[^\/]{1,65})\/(?<sex>[^\/]{1,65})$)/,
                 'method' => qr/(?-xism:^(GET|PUT)$)/,
                 'cb' => [
                           sub { "DUMMY" },
                           sub { "DUMMY" }
                         ],
                 'uri' => '/user/sex/:id/:sex'
               }, 'Route' );
