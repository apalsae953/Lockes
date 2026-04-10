<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['name', 'game_id', 'game_name', 'vidas_max', 'vidas_actuales', 'extra_rules', 'encounters', 'team', 'custom_bosses', 'defeated_bosses'])]
class Run extends Model
{
    protected function casts(): array
    {
        return [
            'extra_rules' => 'array',
            'encounters' => 'array',
            'team' => 'array',
            'custom_bosses' => 'array',
            'defeated_bosses' => 'array',
        ];
    }

    protected $appends = ['captures_count'];

    public function getCapturesCountAttribute()
    {
        return collect($this->encounters ?? [])->where('pokemon', '!=', '')->count();
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

