<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['name', 'pokemon'])]
class Team extends Model
{
    protected function casts(): array
    {
        return [
            'pokemon' => 'array',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
