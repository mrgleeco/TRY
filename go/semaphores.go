package sync

// via albert@cf

import (
    "sync"
    "sync/atomic"
    "testing"
    "time"
)

func TestSemaphore(t *testing.T) {
    sem := NewSemaphore(1000)
    start := make(chan struct{})
    var wg sync.WaitGroup

    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            <-start
            for i := 0; i < 100; i++ {
                sem.Acquire()
                sem.Release()
                //t.Logf("ant done")
            }
            wg.Done()
        }()
    }

    for i := 0; i < 100; i++ {
        wg.Add(1)
        go func() {
            <-start
            for i := 0; i < 10; i++ {
                sem.AcquireN(10)
                sem.ReleaseN(10)
                //t.Logf("springbok done")
            }
            wg.Done()
        }()
    }

    for i := 0; i < 10; i++ {
        wg.Add(1)
        go func() {
            <-start
            for i := 0; i < 10; i++ {
                sem.AcquireN(100)
                sem.ReleaseN(100)
                //t.Logf("lion done")
            }
            wg.Done()
        }()
    }

    for i := 0; i < 3; i++ {
        wg.Add(1)
        go func() {
            <-start
            for i := 0; i < 10; i++ {
                sem.AcquireN(1000)
                sem.ReleaseN(1000)
                //t.Logf("elephant done")
            }
            wg.Done()
        }()
    }

    close(start)

    wg.Wait()
}

func TestSemaphoreTimeout(t *testing.T) {
    sem := NewSemaphore(1)
    if !sem.AcquireNTimeout(1, 1*time.Second) {
        t.Fatalf("AcquireNTimeout failed unexpectedly")
    }
    if sem.AcquireNTimeout(1, 0) {
        t.Fatalf("AcquireNTimeout succeeded unexpectedly")
    }
    // the extra goroutine in AcquireNTimeout hangs
    // around until the wait on the condition returns
    sem.Release()
}

func TestSemaphoreFair(t *testing.T) {
    t.Skip("semaphore isn't fair yet")

    sem := NewSemaphore(100)

    // bargers
    barge := uint32(1)
    for i := 0; i < 200; i++ {
        go func() {
            for atomic.LoadUint32(&barge) != 0 {
                sem.Acquire()
                sem.Release()
            }
        }()
    }

    var wg sync.WaitGroup
    for i := 0; i < 10; i++ {
        wg.Add(1)
        go func() {
            for i := 0; i < 100; i++ {
                sem.AcquireN(100)
                sem.ReleaseN(100)
            }
            wg.Done()
        }()
    }
    wg.Wait()

    atomic.StoreUint32(&barge, 0)
}

