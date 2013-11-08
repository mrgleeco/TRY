package main

import (
    "fmt"
    "regexp"
)

func main() {
    src := "foobar1xfoobar2x"
    pat := regexp.MustCompile("^(.*?)bar(.*)$")
        repl := "${1}baz$2"
    output := pat.ReplaceAllString(src, repl)
    fmt.Println(output)
}
