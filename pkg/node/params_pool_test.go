package node

import (
	"sync"
	"testing"
	"time"

	"github.com/binance-chain/tss-lib/ecdsa/keygen"
	"github.com/ipfs/go-log"
)

func TestTSSPreParamsPool(t *testing.T) {
	err := log.SetLogLevel("*", "DEBUG")
	if err != nil {
		t.Fatalf("logger initialization failed: [%v]", err)
	}

	poolSize := 5

	// Create new pool.
	tssPool := newTestPool(poolSize)

	if len(tssPool.pool) != 0 {
		t.Errorf(
			"invalid init length\nexpected: [%d]\nactual:   [%d]",
			0,
			len(tssPool.pool),
		)
	}

	// Initial pool pump.
	go tssPool.pumpPool()
	time.Sleep(100 * time.Millisecond)

	if len(tssPool.pool) != poolSize {
		t.Errorf(
			"invalid start length\nexpected: [%d]\nactual:   [%d]",
			poolSize,
			len(tssPool.pool),
		)
	}

	// Get entry from pool.
	result := tssPool.get()
	if result == nil {
		t.Errorf("result is nil")
	}

	result = tssPool.get()
	if result == nil {
		t.Errorf("result is nil")
	}

	if len(tssPool.pool) != poolSize-1 {
		t.Errorf(
			"invalid after get length\nexpected: [%d]\nactual:   [%d]",
			poolSize-2,
			len(tssPool.pool),
		)
	}

	// Validate new entry has been autogenerated
	time.Sleep(100 * time.Millisecond)

	if len(tssPool.pool) != poolSize {
		t.Errorf(
			"invalid end length\nexpected: [%d]\nactual:   [%d]",
			poolSize,
			len(tssPool.pool),
		)
	}
}

func TestTSSPreParamsPoolEmpty(t *testing.T) {
	poolSize := 1

	// Create new pool.
	tssPool := newTestPool(poolSize)

	if len(tssPool.pool) != 0 {
		t.Errorf(
			"invalid init length\nexpected: [%d]\nactual:   [%d]",
			0,
			len(tssPool.pool),
		)
	}

	go func() {
		// Delay pumping so we have a chance to test if get function is waiting
		// for an entry.
		time.Sleep(100 * time.Millisecond)

		tssPool.pumpPool()
	}()

	// Get entry from pool.
	result := tssPool.get()
	if result == nil {
		t.Errorf("result is nil")
	}

	if len(tssPool.pool) != 0 {
		t.Errorf(
			"invalid after get length\nexpected: [%d]\nactual:   [%d]",
			0,
			len(tssPool.pool),
		)
	}

	// Validate new entry has been autogenerated
	time.Sleep(100 * time.Millisecond)

	if len(tssPool.pool) != poolSize {
		t.Errorf(
			"invalid end length\nexpected: [%d]\nactual:   [%d]",
			poolSize,
			len(tssPool.pool),
		)
	}
}

func TestTSSPreParamsPoolConcurrent(t *testing.T) {
	poolSize := 5

	// Create new pool.
	tssPool := newTestPool(poolSize)

	waitGroup := &sync.WaitGroup{}
	waitGroup.Add(2)

	go func() {
		if result := tssPool.get(); result == nil {
			t.Errorf("result is nil")
		}
		waitGroup.Done()
	}()
	go func() {
		if result := tssPool.get(); result == nil {
			t.Errorf("result is nil")
		}
		waitGroup.Done()
	}()

	time.Sleep(100 * time.Millisecond)

	go tssPool.pumpPool()

	waitGroup.Wait()

	if len(tssPool.pool) != 0 {
		t.Errorf(
			"invalid after get length\nexpected: [%d]\nactual:   [%d]",
			0,
			len(tssPool.pool),
		)
	}

	// Validate new entries have been autogenerated
	time.Sleep(100 * time.Millisecond)

	if len(tssPool.pool) != poolSize {
		t.Errorf(
			"invalid end length\nexpected: [%d]\nactual:   [%d]",
			poolSize,
			len(tssPool.pool),
		)
	}
}

func newTestPool(poolSize int) *tssPreParamsPool {
	return &tssPreParamsPool{
		pool: make(chan *keygen.LocalPreParams, poolSize),
		new: func() (*keygen.LocalPreParams, error) {
			time.Sleep(10 * time.Millisecond)
			return &keygen.LocalPreParams{}, nil
		},
	}
}
