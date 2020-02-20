module github.com/keep-network/keep-tecdsa

go 1.13

replace (
	github.com/BurntSushi/toml => github.com/keep-network/toml v0.3.0
	github.com/blockcypher/gobcy => github.com/keep-network/gobcy v1.3.1
	github.com/btcsuite/btcd => github.com/keep-network/btcd v0.0.0-20190427004231-96897255fd17
	github.com/btcsuite/btcutil => github.com/keep-network/btcutil v0.0.0-20190425235716-9e5f4b9a998d
	github.com/urfave/cli => github.com/keep-network/cli v1.20.0
)

require (
	github.com/BurntSushi/toml v0.3.1
	github.com/VictoriaMetrics/fastcache v1.5.7 // indirect
	github.com/aristanetworks/goarista v0.0.0-20200211191935-58c705f5cf52 // indirect
	github.com/binance-chain/tss-lib v1.1.1
	github.com/btcsuite/btcd v0.20.1-beta
	github.com/ethereum/go-ethereum v1.9.10
	github.com/gogo/protobuf v1.3.1
	github.com/ipfs/go-log v0.0.1
	github.com/keep-network/keep-common v0.1.1-0.20191203134929-648c427de66e
	github.com/keep-network/keep-core v0.8.1-0.20200205134025-678711a7dd3a
	github.com/olekukonko/tablewriter v0.0.4 // indirect
	github.com/pkg/errors v0.9.1
	github.com/urfave/cli v1.22.1
	golang.org/x/crypto v0.0.0-20200210222208-86ce3cb69678 // indirect
	golang.org/x/sys v0.0.0-20200202164722-d101bd2416d5 // indirect
)
