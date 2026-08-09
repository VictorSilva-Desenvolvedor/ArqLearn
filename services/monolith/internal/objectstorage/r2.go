// Package objectstorage fala com o Cloudflare R2 (S3-compatible, ver
// Docs/ArqLearn_Estrategia_Bootstrap.md §3) — usado por internal/ingestion para gerar a URL
// pré-assinada de upload (Docs/CLAUDE.md, "Não fazer proxy de upload de arquivo pela API").
package objectstorage

import (
	"context"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type Client struct {
	s3     *s3.Client
	presig *s3.PresignClient
	bucket string
}

// New monta um cliente S3 apontado pro endpoint do R2 (não AWS de verdade — region "auto" é o
// valor exigido pelo R2, não uma região real da AWS). Retorna (nil, nil) se alguma credencial
// estiver ausente, para o chamador decidir como lidar com a feature desligada (mesmo padrão de
// groqclient.Enabled()/geminiclient.Enabled()).
func New(accountID, accessKeyID, secretAccessKey, endpoint, bucket string) *Client {
	if accountID == "" || accessKeyID == "" || secretAccessKey == "" || endpoint == "" || bucket == "" {
		return nil
	}

	s3Client := s3.New(s3.Options{
		Region:       "auto",
		BaseEndpoint: aws.String(endpoint),
		Credentials:  credentials.NewStaticCredentialsProvider(accessKeyID, secretAccessKey, ""),
	})

	return &Client{
		s3:     s3Client,
		presig: s3.NewPresignClient(s3Client),
		bucket: bucket,
	}
}

func (c *Client) Enabled() bool {
	return c != nil
}

// PresignUpload gera uma URL de PUT pré-assinada válida por 15 minutos — o cliente sobe o
// arquivo direto pro R2 com ela, sem o backend nunca ver os bytes (ver Docs/CLAUDE.md, "Não
// fazer proxy de upload de arquivo pela API").
func (c *Client) PresignUpload(ctx context.Context, key, contentType string) (string, error) {
	if !c.Enabled() {
		return "", fmt.Errorf("objectstorage: R2 não configurado")
	}

	req, err := c.presig.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(c.bucket),
		Key:         aws.String(key),
		ContentType: aws.String(contentType),
	}, s3.WithPresignExpires(15*time.Minute))
	if err != nil {
		return "", fmt.Errorf("objectstorage: falha ao pré-assinar upload: %w", err)
	}
	return req.URL, nil
}
