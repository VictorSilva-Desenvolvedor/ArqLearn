// Package objectstorage fala com o Cloudflare R2 (S3-compatible, ver
// Docs/ArqLearn_Estrategia_Bootstrap.md §3) — usado pelo pipeline pra baixar o arquivo que o
// usuário subiu direto pro bucket (ver services/monolith/internal/objectstorage, que gera a URL
// pré-assinada de upload; este pacote é o lado que lê o objeto depois, pra extração).
package objectstorage

import (
	"bytes"
	"context"
	"fmt"
	"io"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type Client struct {
	s3     *s3.Client
	bucket string
}

// New monta um cliente S3 apontado pro endpoint do R2 (region "auto", exigido pelo R2 — não é
// uma região real da AWS). Retorna nil se alguma credencial estiver ausente.
func New(accountID, accessKeyID, secretAccessKey, endpoint, bucket string) *Client {
	if accountID == "" || accessKeyID == "" || secretAccessKey == "" || endpoint == "" || bucket == "" {
		return nil
	}

	s3Client := s3.New(s3.Options{
		Region:       "auto",
		BaseEndpoint: aws.String(endpoint),
		Credentials:  credentials.NewStaticCredentialsProvider(accessKeyID, secretAccessKey, ""),
	})

	return &Client{s3: s3Client, bucket: bucket}
}

func (c *Client) Enabled() bool {
	return c != nil
}

// Download baixa o objeto inteiro pra memória — arquivos de estudo (PDF/slide) nesta fase são
// pequenos o bastante pra isso ser seguro; revisitar com streaming se um upload grande demais
// aparecer na prática (ver UPLOAD_TOO_LARGE na API Spec, que já limita o tamanho no momento do
// upload).
func (c *Client) Download(ctx context.Context, key string) ([]byte, error) {
	if !c.Enabled() {
		return nil, fmt.Errorf("objectstorage: R2 não configurado")
	}

	out, err := c.s3.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, fmt.Errorf("objectstorage: falha ao baixar %q: %w", key, err)
	}
	defer out.Body.Close()

	buf := new(bytes.Buffer)
	if _, err := io.Copy(buf, out.Body); err != nil {
		return nil, fmt.Errorf("objectstorage: falha ao ler corpo de %q: %w", key, err)
	}
	return buf.Bytes(), nil
}
