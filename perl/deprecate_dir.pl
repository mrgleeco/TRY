print "ready to deprecate...\n";
print "dir> ";

while(1){
    my $in = <STDIN>;
    chomp $in;
    -d $in or ( warn "no dir $in \n" and next);
    print qx{ date > $in/DEPRECATED };
    print "dir> ";
}
