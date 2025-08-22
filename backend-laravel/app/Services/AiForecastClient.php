<?php

namespace App\Services;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Config;
use Illuminate\Http\Client\RequestException;

class AiForecastClient
{
    protected Client $client;
    protected string $baseUrl;
    protected ?string $apiKey;

    public function __construct()
    {
        $this->baseUrl = rtrim(Config::get('ai.base_url'), '/');
        $this->apiKey  = Config::get('ai.api_key');

        $this->client = new Client([
            'base_uri' => $this->baseUrl,
            'timeout'  => 15,
        ]);
    }

    public function health(): array
    {
        $resp = $this->client->get('/health');
        return json_decode($resp->getBody()->getContents(), true);
    }

    /**
     * $payload = [
     *   "series" => [
     *     ["materiel_id"=>1,"taille_id"=>2,"points"=>[["ds"=>"2024-01-01","y"=>10], ...]],
     *     ...
     *   ],
     *   "horizon_months" => 6
     * ]
     */
    public function forecast(array $payload): array
    {
        $headers = ['Accept' => 'application/json'];
        if ($this->apiKey) {
            $headers['X-API-Key'] = $this->apiKey;
        }

        $resp = $this->client->post('/forecast', [
            'headers' => $headers,
            'json'    => $payload,
        ]);

        return json_decode($resp->getBody()->getContents(), true);
    }
}
