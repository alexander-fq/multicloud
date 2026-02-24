resource "aws_s3_bucket" "test_bucket" {
  bucket = "my-test-bucket"
}

resource "aws_instance" "web" {
  ami           = "ami-12345678"
  instance_type = "t3.medium"
}
