package main

import (
	"encoding/binary"
	"fmt"
	"github.com/golang/geo/s2"
)

func cel(lat, lng float64) s2.CellID {
	return s2.CellIDFromLatLng(s2.LatLngFromDegrees(lat, lng))
}

func main() {
	// create a rect
	//rect := s2.RectFromCenterSize(s2.LatLngFromDegrees(37.08015181711726, -122.17460498684162))
	rect := s2.RectFromLatLng(s2.LatLngFromDegrees(37.0, -122.0))
	rect = rect.AddPoint(s2.LatLngFromDegrees(37.201, -122.101))
	// rect.AddPoint(s2.LatLngFromDegrees(37.0, -122.1))
	// rect.AddPoint(s2.LatLngFromDegrees(37.2, -122.1))
	fmt.Println("rect", rect.String())

	rc := &s2.RegionCoverer{MaxLevel: 30, MaxCells: 1}
	r := s2.Region(rect)
	covering := rc.Covering(r)
	z := covering[0]
	key := make([]byte, 8)
	binary.BigEndian.PutUint64(key, uint64(z))
	fmt.Println("rect size", rect.Size(), rect.IsPoint())
	fmt.Println("covering", covering, "token:", z.ToToken(), "level:", z.Level(), "pos:", z.Pos(), z.String())
	fmt.Println("min:", uint64(z.RangeMin()), "max", uint64(z.RangeMax()))
	fmt.Printf("key=%d\n", uint64(z))

	cc := s2.CellIDFromToken(z.ToToken())
	fmt.Printf("cc=%d\n", uint64(cc))

	// c3 := s2.CellID(uint64(9263428619844190208))
	c3 := s2.CellID(9263428619844190208)
	fmt.Println("c3:", uint64(cc), c3.Level(), c3.String(), c3.ToToken())

}

func hack_zero() {

	// create it as polygon
	tx := []s2.CellID{
		cel(37, 122),
		cel(37.2, -122.1),
	}
	min_level := 30
	for i, c := range tx {
		if i == 0 {
			continue
		}
		level, ok := tx[0].CommonAncestorLevel(c)
		if !ok {
			fmt.Println("bummer")
		}
		if level < min_level {
			min_level = level
		}
	}
	x := tx[0].Parent(min_level)
	fmt.Println(min_level, "cover cell:", x, x.ToToken())

	cells := []s2.CellID{
		cel(-122.111149, 37.370566),
		cel(-122.147369, 37.378479),
		cel(-122.145824, 37.357742),
		cel(-122.111664, 37.370703),
	}
	cu := s2.CellUnion(cells)
	cap := cu.CapBound()
	for c := range cells {
		levl := cells[c].Level()
		fmt.Println("cell", c, levl, cells[c].ToToken(), cells[c].Parent(levl-20).ToToken())
	}

	// try to reduce all points to a common ancestor - recurse!
	var ancs []int
	min_level = 30
	for i, c := range cells {
		if i == 0 {
			continue
		}
		level, ok := cells[0].CommonAncestorLevel(c)
		if !ok {
			fmt.Println("errorz")
		}
		if level < min_level {
			min_level = level
		}
		ancs = append(ancs, level)
	}
	fmt.Println(ancs, "min_level=", min_level)
	//x = cells[0].Parent(min_level)
	// fmt.Println("cover cell:", x, x.ToToken())

	fmt.Println(cells)
	fmt.Println(cap)

	// works!
	poly := []s2.Point{
		s2.PointFromLatLng(s2.LatLngFromDegrees(-122.111149, 37.370566)),
		s2.PointFromLatLng(s2.LatLngFromDegrees(-122.118530, 37.377797)),
		s2.PointFromLatLng(s2.LatLngFromDegrees(-122.135010, 37.366474)),
		s2.PointFromLatLng(s2.LatLngFromDegrees(-122.147369, 37.378479)),
		s2.PointFromLatLng(s2.LatLngFromDegrees(-122.157669, 37.366883)),
		s2.PointFromLatLng(s2.LatLngFromDegrees(-122.145824, 37.357742)),
		s2.PointFromLatLng(s2.LatLngFromDegrees(-122.121277, 37.360334)),
		s2.PointFromLatLng(s2.LatLngFromDegrees(-122.111664, 37.370703)),
	}
	var l = s2.LoopFromPoints(poly)
	var al = []*s2.Loop{l}
	var p = s2.PolygonFromLoops(al)
	fmt.Printf("poly.loops=%d loop=edges=%d\n", p.NumLoops(), l.NumEdges())
	fmt.Println(p.RectBound())

}

/*
func foo() {
	// julietta?
	var poly = [8]s2.Point{
		s2.PointFromLatLng(s2.LatLngFromDegrees(-122.111149, 37.370566)),
		s2.PointFromLatLng(s2.LatLngFromDegrees(-122.118530, 37.377797)),
		s2.PointFromLatLng(s2.LatLngFromDegrees(-122.135010, 37.366474)),
		s2.PointFromLatLng(s2.LatLngFromDegrees(-122.147369, 37.378479)),
		s2.PointFromLatLng(s2.LatLngFromDegrees(-122.157669, 37.366883)),
		s2.PointFromLatLng(s2.LatLngFromDegrees(-122.145824, 37.357742)),
		s2.PointFromLatLng(s2.LatLngFromDegrees(-122.121277, 37.360334)),
		s2.PointFromLatLng(s2.LatLngFromDegrees(-122.111664, 37.370703)),
	}
	var l = s2.LoopFromPoints(poly)
	var p = s2.PolygonFromLoops(l)
	fmt.Println(p.NumLoops)
}
*/
